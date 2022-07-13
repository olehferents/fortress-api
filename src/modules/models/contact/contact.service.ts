import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { error } from "console";
import { Roles } from "src/constants/roles.enum";
import { HouseholdMessageDto } from "src/modules/models/household/dto/householdMessage.dto";
import { Household } from "src/modules/models/household/entity/household.entity";
import { HouseholdMessage } from "src/modules/models/household/entity/householdMessage.mongoEntity";
import { SocketGateway } from "src/modules/socket/socket.gateway";
import { VoiceGrant } from "twilio/lib/jwt/AccessToken";
const twilio = require('twilio');
const VoiceResponse = twilio.twiml.VoiceResponse;
import { Connection, Repository } from "typeorm";
import { User } from "../user/entities/user.entity";
import { UserService } from "../user/user.service";
import { ChildPermissionsDto } from "./dto/childPermissions.dto";
import { ContactMessageDto } from "./dto/contactMessage.dto";
import { EditContactForChildrenDto } from "./dto/editContactForChildren.dto";
import { ContactBadge } from "./entity/contactBadge.entity";
import { Contact } from "./entity/contact.entity";
import { ContactMessage } from "./entity/contactMessage.mongoEntity";
import { NotificationService } from "src/modules/notification/notification.service";
import { messaging } from 'firebase-admin';
const AccessToken = twilio.jwt.AccessToken;
const { VideoGrant } = AccessToken;


@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(ContactMessage, 'mongo')
    private readonly contactMessageRepository: Repository<ContactMessage>,
    @InjectRepository(ContactBadge)
    private readonly badgeRepository: Repository<ContactBadge>,
    private readonly socketGateway: SocketGateway,
    private readonly userService: UserService,
    private readonly connection: Connection,
    private readonly notificationService: NotificationService
  ) { }

  // public async findAllContactsByUser(user: User): Promise<Household> {
  //   const contacts = await this.contactRepository.find({
  //     where: {
  //       id: user.
  //     },
  //     relations: ['users']
  //   });
  //   household.users.forEach(user => delete user.household && delete user.password)

  //   return household;
  // }

  public async findMessagesOfContact(contactId: string): Promise<ContactMessage[]> {
    return await this.contactMessageRepository.find({
      where: {
        contactId
      }
    })
  }

  public async findMissedCallsOfContacts(contactId: string): Promise<ContactMessage[]> {
    return await this.contactMessageRepository.find({
      where: {
        contactId,
        type: 'missedCall'
      }
    })
  }


  public async createContactsBetweenHouseholdMembers(household: Household, user: User): Promise<Contact[]> {
    try {
      household.users = household.users.filter(member => member.id !== user.id);
      let contacts = []
      for (let member of household.users) {
        let contact = this.contactRepository.create()
        contact.text = true
        contact.media = true
        contact.voiceCall = true
        contact.videoCall = true
        contact.users = [member, user]
        contact.badges = []
        contact.users.forEach(user => {
          let badge = this.badgeRepository.create()
          badge.user = user
          badge.contact = contact
          badge.count = 0
          contact.badges.push({...badge})
        })
        contacts.push(contact)
      }
      return contacts;
    } catch (err) {
      throw new InternalServerErrorException(err.detail)
    } 
  }



  public saveMessage(messageDto?: ContactMessageDto): ContactMessage {
    return this.contactMessageRepository.create(messageDto)
  }

  public async deleteContact(contact: Contact): Promise<void> {
    this.contactRepository.remove(contact)
  }

  public async editContactForChildren(parent: User, editContactDto: EditContactForChildrenDto): Promise<void> {
    const queryRunner = this.connection.createQueryRunner()
    try {
      const contact = parent.contacts.find(c => c.id === editContactDto.contactId)
      if (!contact) {
        throw new NotFoundException(`Contact with id ${editContactDto.contactId} not found!`)
      }
      const contactUser = contact?.users?.find(u => u.id !== parent.id)
      if (!contactUser) {
        throw new NotFoundException(`Cannot find user of contact with id ${editContactDto.contactId}`)
      } else {
        let contacts = {update: [], delete: []}
        for (let childDto of editContactDto.children) {
          let child  = parent?.household?.users?.find(u => u.id === childDto.id)
          child = await this.userService.findByUniqueFieldWithRelations({id: child.id}, ['contacts'])
          if (!child) throw new NotFoundException(`Child with id ${childDto.id} not found!`)
          child.contacts = child?.contacts?.filter(c => c?.users?.findIndex(u => u.id === contactUser?.id) !== -1)
  
          switch (childDto?.action) {
            case true:
              if ((child?.contacts?.length < 1)) {
                // create new contact
                let contact = this.contactRepository.create()
                switch (childDto.permission) {
                  case 'villager': 
                    contact.text = true
                    contact.media = false
                    contact.videoCall = false
                    contact.voiceCall = false
                    break
                  case 'grandparent':
                    contact.text = true
                    contact.media= true
                    contact.videoCall= true
                    contact.voiceCall= true
                    break
                }
                contact.users = [child, contactUser]
                contacts?.update?.push(contact)
              } else {
                //edit existing contact
                switch (childDto.permission) {
                  case 'villager': 
                    child.contacts[0].text = true
                    child.contacts[0].media= false
                    child.contacts[0].videoCall= false
                    child.contacts[0].voiceCall= false
                    break
                  case 'grandparent':
                    child.contacts[0].text = true
                    child.contacts[0].media= true
                    child.contacts[0].videoCall= true
                    child.contacts[0].voiceCall= true
                    break
                }
                contacts?.update?.push(child?.contacts[0])        
              }
              break
            case false:
              if ((child?.contacts?.length >= 1)) {
                contacts.delete.push(child.contacts[0])
              }
              break
          }
        }
        await queryRunner.connect()
        await queryRunner.startTransaction()
        contacts?.update?.length ? 
          await queryRunner.manager.save<Contact[]>(contacts.update) : null
        contacts?.delete?.length ?
          await queryRunner.manager.remove(Contact, contacts.delete) : null
        await queryRunner.commitTransaction()
      }
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(err.detail)
    } finally {
      await queryRunner.release()
    }   
  }

  public async initDeleteContact(user: User, contactId: string, childId: string = null): Promise<void> {
    try {
      const contact = user?.contacts?.find(contact => contact.id === contactId)
      let childContact = await this.contactRepository.findOne({where:{
        id: contactId,
      },
        relations: ['users']
      })
      if ( typeof contact !==  'undefined') {
        await this.deleteContact(contact)
      } else if (
        childContact !== null && 
        [Roles.PARENT as string, Roles.SECOND_PARENT as string].includes(user.role) && 
        childContact.users.findIndex(usr => usr.id === childId) !== -1
        ) {
        await this.deleteContact(childContact)
      } else {
        throw new NotFoundException(`Contact with id ${contactId} does not exist`)
      }
    } catch (err) {  
      throw new InternalServerErrorException(err.detail)
    }
  }

  public async sendMessage(message: ContactMessage, contact: Contact, sender: User): Promise<ContactMessage> {
    console.log('im in send Message')
    const queryRunner = this.connection.createQueryRunner()
    console.log('xxxx')
    try {
      contact?.badges?.map(badge => {
        badge.count = badge.user.id !== sender.id ? badge.count += 1 : badge.count
        return badge
      })
      await queryRunner.connect()
      await queryRunner.startTransaction()
      await queryRunner.manager.save<Contact>(contact)
      await this.contactMessageRepository.save(message)
      await queryRunner.commitTransaction()
      console.log(message)
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
    let message = await this.contactMessageRepository.findOne(messageId)
    let all = await this.contactMessageRepository.find()
    console.log(all)
    console.log(message)
    if (user?.id === message?.userId || ![undefined, -1].includes(user?.household?.users?.findIndex(usr => usr.id === message?.userId && usr.role === Roles.CHILD))) {
      await this.contactMessageRepository.delete(message)
    } else {
      throw new UnauthorizedException('Not enough privileges to delete message!')
    }
  }

  public async generateVideoToken(user: User, contactId: string): Promise<any> {
    try {
      let contact = await this.contactRepository.findOne(contactId, {
        relations: ['users']
      })
      const videoGrant = contact ? 
        new VideoGrant({room: contact.id}) : 
        new VideoGrant()
      const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_VIDEO_KEY,
        process.env.TWILIO_API_VIDEO_SECRET
      );
      token.addGrant(videoGrant)
      token.identity = user.username
      return {token: token.toJwt(), identity: user.username, room: contact.id}
    } catch (err) {
      console.error(err)
    }
  }

  public async cancelVideoCall(user: User, contactId: string): Promise<any> {
    try {
      const plainUser = {
        contactId,
        id: user.id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        profileImage: user.profileImage
      };
      user.contacts.forEach(contact => {
        if (contact.id === contactId) {
          contact.users.forEach(async contactUser => {
            if (contactUser.id !== user.id) {
              const devices = await this.notificationService.findDeviceTokensForUser([contactUser])
              const message = this.saveMessage()
              message.contactId = contactId;
              message.userId = user.id;
              message.type = 'missedCall';
              await this.sendMessage(message, contact, user)
              this.socketGateway.handleCancelContactVideoCall(message, contactUser.id)
              this.notificationService.notifyCancelledContactCall(devices, user, contactId);
            }
          })
        }          
      })
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  public informOfInterlocutorCamera(user: User, contactId: string, isCameraOn: boolean) {
    console.log('test');
    let message = isCameraOn
      ?
      'Interlocutor turned on the camera'
      :
      'Interlocutor turned off the camera'
    user.contacts.forEach(contact => {
      if(contact.id !== contactId){
        contact.users.forEach(contactUser => {
          this.socketGateway.handleInformOfInterlocutorCamera( message, contactUser.id)
        })
      }
    })

  }



  public generateVoiceToken(user: User, contactId: string): any {
    const contact = user?.contacts?.find(contact => contact.id === contactId)
    if (!contact) 
      throw new NotFoundException('Contact with id' + contactId + 'not found!')
    if (!contact?.voiceCall) 
      throw new UnauthorizedException('Not enough privileges to call this user!')
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
    return {token: token.toJwt(), identity: user.username, room: contactId}
  }

  public startVoiceCall(user: User, contactId: string): any {
    try {
      const contact = user?.contacts?.find(contact => contact.id === contactId)
      contact.users = contact?.users?.filter(u => u.id !== user.id)
      if (!contact) 
        throw new NotFoundException('Contact with id' + contactId + 'not found!')
      if (!contact?.voiceCall) 
        throw new UnauthorizedException('Not enough privileges to call this user!')
      const response = new VoiceResponse()
      const dial = response.dial({callerId: process.env.TWILIO_PHONE_NUMBER})
      dial.number({}, contact?.users[0]?.phoneNumber)
      return response
    } catch (err) {
      console.log(err)
      throw new InternalServerErrorException(err)
    }
  }

  // public handleIncomingVoiceCall(user: User, contactId: string): any {
  //   const contact = user.contacts.find(contact => contact.id === contactId)
  //   if (!contact?.voiceCall) 
  //     throw new UnauthorizedException('Not enough privileges to call this user!')
  //   const response = new VoiceResponse()
  //   const dial = response.dial({callerId: process.env.TWILIO_PHONE_NUMBER, answerOnBridge: true })
  //   dial.number(contact.id)
  //   return response
  // }

  public async dropCountFromContactBadge(user: User, contactId: string): Promise<void> {
    try {
      let contact = user.contacts.find(contact => contact.id === contactId)
      if (!contact) {
        throw new NotFoundException('Contact with id ' + contactId + ' not found!')
      }
      contact.badges.map(badge => badge.count = badge.user.id === user.id ? 0 : badge.count)
      await this.contactRepository.save(contact)  
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }
}