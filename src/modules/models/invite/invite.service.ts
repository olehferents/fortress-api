import { forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectTwilio, TwilioClient } from 'nestjs-twilio'
import { SocketGateway } from 'src/modules/socket/socket.gateway'
import { Repository } from 'typeorm'
import { ContactService } from '../contact/contact.service'
import { AddToContactsRequestDto } from '../request/dto/addToContactsRequest.dto'
import { RequestService } from '../request/request.service'
import { User } from '../user/entities/user.entity'
import { UserService } from '../user/user.service'
import { InviteDto } from './dto/invite.dto'
import { Invite } from './entity/invite.entity'

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(Invite) private readonly inviteRepository: Repository<Invite>,
    @InjectTwilio() private readonly twilioClient: TwilioClient,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService, 
    private readonly contactService: ContactService,
    private readonly requestService: RequestService,
  ) {}

  public async sendInvitation(inviteDto: InviteDto, user: User): Promise<void> {
    try {
      inviteDto.phoneNumber = inviteDto.phoneNumber.replace(/[^0-9+]/g, '') 
      let invite = this.inviteRepository.create(inviteDto)
      invite.invitedBy = user
      await this.inviteRepository.save(invite)
      this.twilioClient.messages.create({
         body: `Greetings ${inviteDto.firstName} ${inviteDto.lastName} you were invited `+
         ` as ${inviteDto.role} to Fortress application by ${user.firstName} ${user.lastName}`,
         messagingServiceSid: process.env.TWILIO_INVITATION_SERVICE,
         to: invite.phoneNumber,
       }).then(msg => console.log(msg))
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  public async getLatestInviteByPhone(phoneNumber: string): Promise<Invite> {
    try {
      return await this.inviteRepository.findOne({where: {phoneNumber}, relations: ['invitedBy', 'invitedBy.household']})
    } catch (err) {
      throw new InternalServerErrorException(err.detail)
    }
  }

  public async sendInvitationOrRequest(invite: InviteDto, user: User): Promise<void> {
    try {
      let candidate = await this.userService.findByUniqueFieldWithRelations({phoneNumber: invite.phoneNumber})
      if (candidate) {
        let request = new AddToContactsRequestDto()
        request.targetId = candidate.id
        request.message = request.message ? 
          request.message : `${user.firstName} ${user.lastName} wants to add you to his/her contact list`
        return await this.requestService.initSendRequest(user, request)
      } else {
        return await this.sendInvitation(invite, user)
      }
    } catch (err) {
      throw new Error(err)
    }
  }
}
