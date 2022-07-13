import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { SocketGateway } from '../../socket/socket.gateway';
import { User } from '../user/entities/user.entity';
import { HouseholdMessageDto } from './dto/householdMessage.dto';
import { Household } from './entity/household.entity';
import { HouseholdMessage } from './entity/householdMessage.mongoEntity';
import { ContactService } from '../contact/contact.service';
import { Roles } from 'src/constants/roles.enum';
import { HouseholdRelations } from './interfaces/household-relations.interface';
import { UserService } from '../user/user.service';
import { MissedCall } from 'src/modules/models/missedCall/entity/missedCall.entity';
import { NotificationService } from 'src/modules/notification/notification.service';
const twilio = require('twilio');
const { VoiceResponse } = twilio.twiml;
const { AccessToken } = twilio.jwt;
const { VideoGrant, VoiceGrant } = AccessToken;

@Injectable()
export class HouseholdService {
  constructor(
    @InjectRepository(Household)
    private readonly householdRepository: Repository<Household>,
    @InjectRepository(HouseholdMessage, 'mongo')
    private readonly householdMessageRepository: Repository<HouseholdMessage>,
    private readonly socketGateway: SocketGateway,
    private readonly contactService: ContactService,
    private readonly userService: UserService,
    private readonly connection: Connection,
    private readonly notificationService: NotificationService
  ) {}

  public create() {
    return this.householdRepository.create();
  }

  public async findOne(
    { user, id }: any,
    relations: HouseholdRelations,
    clean: boolean = true,
  ) {
    try {
      const {
        users,
        usersInReq,
        usersOutReq,
        contacts,
        contactUsers,
        householdOfUsers,
        householdMessages,
        contactMessages,
        all,
      } = relations;
      let household = await this.householdRepository.findOne({
        where: user ? { id: user.household.id } : { id },
        join: {
          alias: 'household',
          leftJoinAndSelect: {
            users: users || all ? 'household.users' : null,
            usersInReq: usersInReq || all ? 'users.inReq' : null,
            usersOutReq: usersOutReq || all ? 'users.outReq' : null,
            contacts: contacts || all ? 'users.contacts' : null,
            contactUsers: contactUsers || all ? 'contacts.users' : null,
            householdOfUsers:
              householdOfUsers || all ? 'users.household' : null,
          },
        },
      });
      console.log(household, "HOUSEHOLD");
      if (clean) {
        household?.users?.forEach(
          (user) => delete user?.household && delete user?.password,
        );
        user
          ? (household.users = household?.users.filter(
              (usr) => usr.id !== user.id,
            ))
          : null;
        householdMessages || all
          ? (household['messages'] = await this.findMessagesOfHousehold(id))
          : null;
        for (let user of household?.users) {
          for (let contact of user?.contacts) {
            contact.users = contact?.users?.filter((usr) => usr.id !== user.id);
            contactMessages || all
              ? (contact['messages'] =
                  await this.contactService.findMessagesOfContact(contact.id))
              : null;
          }
        }
      } else {
        householdMessages || all
          ? (household['messages'] = await this.findMessagesOfHousehold(id))
          : null;
        for (let user of household?.users) {
          for (let contact of user?.contacts) {
            contactMessages || all
              ? (contact['messages'] =
                  await this.contactService.findMessagesOfContact(contact.id))
              : null;
          }
        }
      }
      return household;
    } catch (err) {
      throw new InternalServerErrorException(err);
    }
  }

  public async findMessagesOfHousehold(
    householdId: string,
  ): Promise<HouseholdMessage[]> {
    return await this.householdMessageRepository.find({
      where: {
        householdId,
      },
    });
  }

  public async findMissedCallsOfHousehold(
    householdId: string,
  ): Promise<HouseholdMessage[]> {
    return await this.householdMessageRepository.find({
      where: {
        householdId,
        type: 'missedCall',
      },
    });
  }

  public saveMessage(messageDto?: HouseholdMessageDto): HouseholdMessage {
    return this.householdMessageRepository.create(messageDto);
  }

  // public async sendMessage(messageDto: HouseholdMessageDto): Promise<HouseholdMessage> {
  //   return await this.householdMessageRepository.save(messageDto);
  // }

  public async sendMessage(message: HouseholdMessage, sender: User): Promise<HouseholdMessage> {
    const queryRunner = this.connection.createQueryRunner()
    try {
      sender?.household?.badges?.map(badge => {
        badge.count = badge.user.id !== sender.id ? badge.count += 1 : badge.count
        return badge
      })
      await queryRunner.connect()
      await queryRunner.startTransaction()
      await queryRunner.manager.save<Household>(sender.household)
      await this.householdMessageRepository.save(message)
      await queryRunner.commitTransaction()
      return message
    } catch (err) {
      await queryRunner.rollbackTransaction()
      console.log(err)
      throw new InternalServerErrorException(err)
    } finally {
      await queryRunner.release()
    }
  }

  public async deleteMessage(messageId: string, user: User): Promise<void> {
    let message = await this.householdMessageRepository.findOne(messageId);
    if (
      user?.id === message?.userId ||
      ![undefined, -1].includes(
        user?.household?.users?.findIndex(
          (usr) => usr.id === message?.userId && usr.role === Roles.CHILD,
        ),
      )
    ) {
      await this.householdMessageRepository.delete(message);
    } else {
      throw new UnauthorizedException(
        'Not enough privileges to delete message!',
      );
    }
  }


  public async cancelHouseholdVideoConference(user: User): Promise<any> {
    try {
      const plainUser = {
        id: user.id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        profileImage: user.profileImage
      };
      const notifyUsers = user.household.users.filter((householdUser) => user.id !== householdUser.id)
      const devices = await this.notificationService.findDeviceTokensForUser(notifyUsers)
      const message = this.saveMessage()
      message.householdId = user.household.id;
      message.userId = user.id;
      message.type = 'missedCall';
      await this.sendMessage(message, user)
      this.socketGateway.handleCancelHouseholdVideoConference(message, user.household.id)
      this.notificationService.notifyCancelledHouseholdCall(devices, user);
    } catch (err) {
      throw new InternalServerErrorException(err.detail)
    }
  }

  public generateVideoToken(user: User): any {
    const videoGrant = user?.household?.id
      ? new VideoGrant({ room: user?.household?.id })
      : new VideoGrant();
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_VIDEO_KEY,
      process.env.TWILIO_API_VIDEO_SECRET,
    );
    token.addGrant(videoGrant);
    token.identity = user.username;
    return {
      token: token.toJwt(),
      identity: user.username,
      room: user.household.id,
    };
  }

  public generateVoiceToken(user: User): any {

    let voiceGrant = process.env.TWILIO_OUTGOING_SID ? new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_OUTGOING_SID,
      incomingAllow: true
    }) : new VoiceGrant({
      incomingAllow: true
    })
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_VOICE_KEY,
      process.env.TWILIO_API_VOICE_SECRET
    );
    token.addGrant(voiceGrant)
    token.identity = user.username
    return {token: token.toJwt(), identity: user.username, room: user.household.id};
  }

  public startVoiceConference(user: User): any {
    try {
      if (user.household.users.length < 2 ) 
        throw new NotFoundException('You cannot make call to household with only one user');
      const response = new VoiceResponse()
      const dial = response.dial({callerId: user.id})
      dial.conference(user.household.id, {
        startConferenceOnEnter: true,
      })
      return response
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  public async dropCountFromContactBadge(user: User): Promise<void> {
    try {
      user.household.badges.map(badge => badge.count = badge.user.id === user.id ? 0 : badge.count)
      await this.householdRepository.save(user.household)  
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }
}


  // public handleIncomingVoiceCall(user: User): any {
  //   const response = new VoiceResponse()
  //   const dial = response.dial({callerId: process.env.TWILIO_PHONE_NUMBER, answerOnBridge: true })
  //   dial.number(user.household.id)
  //   return response
  // }
// }
