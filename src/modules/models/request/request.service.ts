import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from '../user/entities/user.entity'
import { Connection, LessThan, Repository } from 'typeorm'
import { HouseholdMessageDto } from '../household/dto/householdMessage.dto'
import { Household } from '../household/entity/household.entity'
import { HouseholdMessage } from '../household/entity/householdMessage.mongoEntity'
import { AddToContactsRequestDto } from './dto/addToContactsRequest.dto'
import { UserService } from '../user/user.service'
import { SocketGateway } from '../../socket/socket.gateway'
import { AcceptRequestDto } from './dto/acceptRequest.dto'
import { Contact } from '../contact/entity/contact.entity'
import { Roles } from 'src/constants/roles.enum'
import { ContactReq } from './entity/request.entity'
import { MessagesEnum } from 'src/constants/messagesEnum/messages.enum'
import { HouseholdService } from '../household/household.service'
import { DenyRequestDto } from './dto/denyRequest.dto'
import { NotificationService } from 'src/modules/notification/notification.service'
import { ContactBadge } from '../contact/entity/contactBadge.entity'

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(ContactReq)
    private readonly requestRepository: Repository<ContactReq>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => HouseholdService))
    private readonly householdService: HouseholdService,
    private readonly socketGateway: SocketGateway,
    private readonly connection: Connection,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
    @InjectRepository(ContactBadge)
    private readonly badgeRepository: Repository<ContactBadge>,
  ) {}

  public async initSendRequest(
    sender: User,
    requestDto: AddToContactsRequestDto,
  ): Promise<any> {
    try {
      let request = await this.createRequest(sender, requestDto)
      if (request.sender.role === Roles.CHILD) {
        request = await this.requestRepository.save({
          ...request,
          media: false,
          voiceCall: false,
          videoCall: false
        })
        this.sendRequestToParents(sender, request)
      } else if (request.target.role === Roles.CHILD) {
         request = await this.requestRepository.save({
          ...request,
          media: false,
          voiceCall: false,
          videoCall: false
        })
        this.sendRequestToParents(request.target, request, false)
      } else {
        this.sendRequestToUser(request)
      }
    } catch (err) {
      throw new ConflictException(err)
    }
  }

  public async addMultipleChildrenToContacts(acceptRequest, request) {
    const queryRunner = this.connection.createQueryRunner()
    try {
      const { id, target, ...other } = request
      const { children, ...rest } = acceptRequest
      let parentContacts
      if (request.sender.role === Roles.CHILD && target.role === Roles.CHILD) {
        parentContacts = await this.createContactsBetweenParents(request)
      }
      else if (request.sender.role === Roles.PARENT && target.role === Roles.CHILD) {
        parentContacts = await this.createContactsBetweenParents(request)
      }
      let contacts = []
      for (let id of children) {
        const child = await this.userService.findByUniqueFieldWithRelations({
          id,
        })
        console.log(parentContacts, '87')
        console.log('84')
        const contact = this.contactRepository.create(rest as AcceptRequestDto)
        contact.users = [child, request.sender]
        contact.badges = []
        contact.users.forEach((user) => {
          let badge = this.badgeRepository.create()
          badge.user = user
          badge.contact = contact
          badge.count = 0
          contact.badges.push({ ...badge })
        })
        contacts.push(contact)
        console.log(contacts, '100')
      }
      await queryRunner.connect()
      await queryRunner.startTransaction()
      parentContacts
        ? await queryRunner.manager.save<Contact[]>([
            ...contacts,
            ...parentContacts,
          ])
        : await queryRunner.manager.save<Contact[]>(contacts)
      await queryRunner.manager.remove(ContactReq, request)
      await queryRunner.commitTransaction()
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(err)
    } finally {
      await queryRunner.release()
    }
  }

  public async initAcceptRequest(
    acceptRequest: AcceptRequestDto,
    user: User,
  ): Promise<any> {
    try {
      acceptRequest = this.convertAcceptRequestToBoolean(acceptRequest)
      let request = await this.findById(acceptRequest.requestId)

      if (!request) {
        throw new NotFoundException('Request with this id does not exist!')
      }

      const isRequestExistsInArray =
        user.inReq.findIndex((req) => req.id === request.id) !== -1
      const isParentOfTarget =
        request.target?.household?.id === user.household?.id
      const isParentOfSender =
        request.sender?.household?.id === user.household?.id
      const isUserTarget = user?.id === request?.target?.id

      console.log(
        isRequestExistsInArray,
        isParentOfTarget,
        isParentOfSender,
        isUserTarget,
      )
      if (
        isUserTarget &&
        isRequestExistsInArray &&
        request?.target?.role !== Roles.CHILD
      ) {
        if (user.role === Roles.PARENT && acceptRequest?.children?.length > 0) {
          this.acceptRequestAndAddChildren(user, acceptRequest, request)
        } else {
          let contact = this.contactRepository.create(acceptRequest)
          this.acceptRequest(contact, request)
        }
      } else if (
        !isUserTarget &&
        isRequestExistsInArray &&
        request?.target?.role === Roles.CHILD &&
        isParentOfTarget
      ) {
        if (acceptRequest?.children?.length > 0) {
          this.addMultipleChildrenToContacts(acceptRequest, request)
          await this.requestRepository.delete(request)
        } else {
          request = await this.changeRequestPermissions(request, acceptRequest)
          let contact = this.contactRepository.create(acceptRequest)

          this.acceptRequest(contact, request)
        }
      } else if (
        !isUserTarget &&
        isParentOfSender &&
        request?.target?.role !== Roles.CHILD &&
        isRequestExistsInArray
      ) {
        if (acceptRequest?.children?.length > 0) {
          const { id, sender, ...other } = request

          for (let id of acceptRequest.children) {
            const child = await this.userService.findByUniqueFieldWithRelations(
              { id },
            )
            let req = this.requestRepository.create(other)
            req.sender = child
            await this.requestRepository.save(request)
            this.sendRequestToUser(req)
            req.id = request.id
            this.moveFromInToOutReq(req, sender.household.id)
          }
        } else {
          this.sendRequestToUser(request)
          this.moveFromInToOutReq(request, request.sender.household.id)
          let targetDevices =
            await this.notificationService.findDeviceTokensForUser([
              request.target,
            ])
          await this.notificationService.notifyRequest(
            targetDevices,
            request,
            false,
          )
        }
      } else if (
        !isUserTarget &&
        isRequestExistsInArray &&
        isParentOfSender &&
        request?.target?.role === Roles.CHILD
      ) {
        request = await this.changeRequestPermissions(request, acceptRequest)
        this.moveFromInToOutReq(request, request.sender.household.id)
        this.sendRequestToParents(request.target, request, false)
      }
    } catch (err) {
      console.log(err, 'init accept')
    }
  }

  public async acceptRequestAndAddChildren(
    parent: User,
    acceptRequest: AcceptRequestDto,
    request: ContactReq,
  ): Promise<void> {
    const queryRunner = this.connection.createQueryRunner()
    try {
      console.log('exec')
      let contacts = []
      let parentContact = this.contactRepository.create(acceptRequest)
      parentContact.users = [request.target, request.sender]
      parentContact.badges = []
      parentContact.users.forEach((user) => {
        let badge = this.badgeRepository.create()
        badge.user = user
        badge.contact = parentContact
        badge.count = 0
        parentContact.badges.push({ ...badge })
      })
      console.log(acceptRequest.children)
      for (let child of acceptRequest.children) {
        console.log(child)
          let candidate = await this.userService.findByUniqueFieldWithRelations(
            { id: child },
          )
          console.log(candidate)
          if (!candidate)
            throw new NotFoundException(`Child with ${child} does not exist`)
          let contact = this.contactRepository.create(acceptRequest)
          contact.users = [candidate, request.sender]
          contact.badges = []
          contact.users.forEach((user) => {
            let badge = this.badgeRepository.create()
            badge.user = user
            badge.contact = contact
            badge.count = 0
            contact.badges.push({ ...badge })
          })
          contacts.push(contact)
      }
      await queryRunner.connect()
      await queryRunner.startTransaction()
      await queryRunner.manager.save<Contact[]>([parentContact, ...contacts])
      await queryRunner.manager.remove(ContactReq, request)
      await queryRunner.commitTransaction()
    } catch (err) {
      console.error(err.detail)
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(err)
    } finally {
      await queryRunner.release()
    }
  }

  public async initDenyRequest(
    user: User,
    { requestId }: DenyRequestDto,
  ): Promise<void> {
    try {
      const request = await this.requestRepository.findOne(requestId, {
        relations: ['target', 'sender', 'target.household', 'sender.household'],
      })
      if (user.inReq.findIndex((req) => req.id === request.id) !== -1) {
        await this.requestRepository.remove(request)
        this.sendNotificationOnRequestDeny(request.sender, request.target)
      } else {
        throw new NotFoundException(
          `Request with id ${requestId} was not found!`,
        )
      }
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  public async sendRequestToUser(request: ContactReq) {
    const queryRunner = this.connection.createQueryRunner()
    try {
      let { sender, target } = request
      sender = await this.userService.findByUniqueFieldWithRelations(
        { id: sender.id },
        ['contacts', 'household', 'primaryAccount', 'inReq', 'outReq'],
      )
      target = await this.userService.findByUniqueFieldWithRelations(
        { id: target.id },
        ['contacts', 'household', 'primaryAccount', 'inReq', 'outReq'],
      )
      sender.outReq.push(request)
      target.inReq.push(request)
      await queryRunner.connect()
      await queryRunner.startTransaction()
      await queryRunner.manager.save<User[]>([sender, target])
      await queryRunner.commitTransaction()
      this.socketGateway.handleAddToContactRequestToUser(request, target.id)
      let devices = await this.notificationService.findDeviceTokensForUser([
        target,
      ])
      this.notificationService.notifyRequest(devices, request, false)
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(err)
    } finally {
      await queryRunner.release()
    }
  }

  public async sendRequestToParents(
    child: User,
    request: ContactReq,
    isSentByChild: boolean = true,
  ) {
    const queryRunner = this.connection.createQueryRunner()
    try {
      let { sender } = request
      sender = await this.userService.findByUniqueFieldWithRelations(
        { id: sender.id },
        ['contacts', 'household', 'primaryAccount', 'inReq', 'outReq'],
      )
      const household = await this.householdService.findOne(
        { id: child?.household?.id },
        { all: true },
      )
      if (!household) {
        throw new NotFoundException('Household of child not found')
      }
      let parents = []
      household.users.forEach((user) => {
        if (
          [Roles.PARENT as string, Roles.SECOND_PARENT as string].includes(
            user.role,
          )
        ) {
          user.inReq.push(request)
          parents.push(user)
        }
      })

      console.log("------- Parents", parents);
      isSentByChild
        ? child.outReq.push(request)
        : child.inReq.push(request) && sender.outReq.push(request)
      await queryRunner.connect()
      await queryRunner.startTransaction()
      request.sender.id === child.id
        ? await queryRunner.manager.save<User[]>([child, ...parents])
        : await queryRunner.manager.save<User[]>([sender, child, ...parents])
      await queryRunner.commitTransaction()
      request = this.deleteExtraFieldsFromRequest(request)
      this.socketGateway.handleAddToContactRequestToParents(
        request,
        household.id,
      )
      let parentDevices =
        await this.notificationService.findDeviceTokensForUser(parents)
      if (!isSentByChild) {
        await this.notificationService.notifyRequestForParents(
          parentDevices,
          request,
          false,
        )
        await this.notificationService.notifyRequest(
          await this.notificationService.findDeviceTokensForUser([child]),
          request,
          false,
        )
      } else {
        await this.notificationService.notifyRequestForParents(
          parentDevices,
          request,
        )
      }
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(err)
    } finally {
      await queryRunner.release()
    }
  }

  public async createRequest(
    sender: User,
    requestDto: AddToContactsRequestDto,
  ): Promise<ContactReq> {
    try {
      sender?.contacts.forEach((contact) => {
        if (
          contact?.users?.findIndex(
            (user) => user.id === requestDto.targetId,
          ) !== -1
        ) {
          throw new ConflictException(
            'You cannot send request to your contact!',
          )
        }
      })
      if (
        [
          Roles.PARENT.toString(),
          Roles.SECOND_PARENT.toString(),
          Roles.TEENAGER.toString(),
        ].includes(sender.role) &&
        sender?.household?.users?.findIndex(
          (usr) => usr.id === requestDto.targetId,
        ) !== -1
      ) {
        throw new ConflictException(
          'You cannot send request to your household member!',
        )
      }
      if (
        sender.outReq.findIndex(
          (req) =>
            req.sender.id === sender.id &&
            req.target.id === requestDto.targetId,
        ) !== -1
      ) {
        throw new ConflictException(
          'You have already sent request to this user!',
        )
      }
      const target = await this.userService.findByUniqueFieldWithRelations(
        { id: requestDto.targetId },
        ['contacts', 'household', 'primaryAccount', 'inReq', 'outReq'],
      )
      let request = this.requestRepository.create()
      request.target = target
      request.sender = sender
      request.message = requestDto.message

      await this.requestRepository.save(request)
      return request
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  public deleteExtraFieldsFromRequest(request: ContactReq): ContactReq {
    try {
      delete request.target.household
      delete request.target.inReq
      delete request.target.outReq
      delete request.sender.household
      delete request.sender.inReq
      delete request.sender.outReq
      return request
    } catch (err) {
      throw new Error(err.message)
    }
  }

  public async findById(requestId: string) {
    try {
      return await this.requestRepository.findOne(requestId, {
        join: {
          alias: 'request',
          leftJoinAndSelect: {
            sender: 'request.sender',
            target: 'request.target',
            hshldSender: 'sender.household',
            hshldTarget: 'target.household',
            contactsOfSender: 'sender.contacts',
            contactsOfTarget: 'target.contacts',
            inReqOfTarget: 'target.inReq',
          },
        },
      })
    } catch (err) {
      throw new Error(err.message)
    }
  }

  public convertAcceptRequestToBoolean(acceptRequest: AcceptRequestDto) {
    try {
      const truthy = ['1', 1, true, 'true']

      acceptRequest.text = truthy.includes(acceptRequest.text) ? true : false
      acceptRequest.media = truthy.includes(acceptRequest.media) ? true : false
      acceptRequest.voiceCall = truthy.includes(acceptRequest.voiceCall)
        ? true
        : false
      acceptRequest.videoCall = truthy.includes(acceptRequest.videoCall)
        ? true
        : false
      return acceptRequest
    } catch (err) {
      throw new Error(err)
    }
  }

  public async moveFromInToOutReq(request: ContactReq, householdId = null) {
    const queryRunner = this.connection.createQueryRunner()
    try {
      const household = await this.householdService.findOne(
        { id: householdId},
        { all: true },
      )
      let parents = []
      household.users.forEach((user) => {
        if (
          [
            Roles.PARENT as string,
            Roles.SECOND_PARENT as string,
          ].includes(
            user.role,
          )
        ) {
          user.inReq = user.inReq.filter((req) => req.id !== request.id)
          user.outReq.push(request)
          parents.push(user)
        }
      })
      await queryRunner.connect()
      await queryRunner.startTransaction()
      await queryRunner.manager.save<User[]>(parents)
      await queryRunner.commitTransaction()
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(err)
    } finally {
      await queryRunner.release()
    }
  }

  public async changeRequestPermissions(
    request: ContactReq,
    acceptRequest: AcceptRequestDto,
  ) {
    const queryRunner = this.connection.createQueryRunner()
    try {
      request.text = request.text
        ? acceptRequest.text && request.text
        : acceptRequest.text
      request.media = request.media
        ? acceptRequest.media && request.media
        : acceptRequest.media
      request.voiceCall = request.voiceCall
        ? acceptRequest.voiceCall && request.voiceCall
        : acceptRequest.voiceCall
      request.videoCall = request.videoCall
        ? acceptRequest.videoCall && request.videoCall
        : acceptRequest.videoCall
      if(
        (request.sender.role == Roles.PARENT && request.target.role == Roles.CHILD)
        ||
        (request.sender.role == Roles.CHILD && request.target.role == Roles.PARENT)
      )

      await queryRunner.connect()
      await queryRunner.startTransaction()
      await queryRunner.manager.save<ContactReq>(request)
      await queryRunner.commitTransaction()
      return request
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(err)
    } finally {
      await queryRunner.release()
    }
  }

  public async acceptRequest(contact: Contact, request: ContactReq) {
    console.log('im in accept request')
    console.log(contact)
    console.log(request)
    const queryRunner = this.connection.createQueryRunner()
    try {
      let { sender, target } = request
      let parentContacts
      if (
        (sender.role === Roles.CHILD && target.role === Roles.CHILD)
        ||
        (sender.role === Roles.PARENT && target.role === Roles.CHILD)
      ) {
        console.log('im in condition')
        parentContacts = await this.createContactsBetweenParents(request)
      }
      contact.users = [sender, target]
      contact.text = request.text && contact.text
      contact.media = request.media && contact.media
      contact.voiceCall = request.voiceCall && contact.voiceCall
      contact.videoCall = request.videoCall && contact.videoCall
      contact.badges = []
      contact.users.forEach((user) => {
        let badge = this.badgeRepository.create()
        badge.user = user
        badge.contact = contact
        badge.count = 0
        contact.badges.push({ ...badge })
      })
      await queryRunner.connect()
      await queryRunner.startTransaction()
      parentContacts
        ? await queryRunner.manager.save<Contact[]>([
            contact,
            ...parentContacts,
          ])
        : await queryRunner.manager.save<Contact>(contact)
      // await queryRunner.manager.save<Badge[]>([...contact.badges])
      await queryRunner.manager.remove(ContactReq, request)
      await queryRunner.commitTransaction()
      this.sendNotificationOnRequestAccept(sender, target)
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(err)
    } finally {
      await queryRunner.release()
    }
  }

  public async createContactsBetweenParents(
    request: ContactReq,
  ): Promise<Contact[]> {
    const { sender, target } = request
    console.log('629')
    let contacts = []
    let householdOfSender = await this.householdService.findOne(
      { user: sender },
      { all: true },
    )
    console.log(householdOfSender)
    let householdOfTarget = await this.householdService.findOne(
      { user: target },
      { all: true },
    )
    householdOfSender.users = householdOfSender.users.filter((member) =>
      [Roles.PARENT as string, Roles.SECOND_PARENT as string].includes(
        member.role,
      ),
    )
    householdOfTarget.users = householdOfTarget.users.filter((member) =>
      [Roles.PARENT as string, Roles.SECOND_PARENT as string].includes(
        member.role,
      ),
    )
    for (let senderMember of householdOfSender.users) {
      for (let targetMember of householdOfTarget.users) {
        let contact = this.contactRepository.create()
        contact.users = [senderMember, targetMember]
        contact.text = true
        contact.media = true
        contact.voiceCall = true
        contact.videoCall = true
        contact.badges = []
        contact.users.forEach((user) => {
          let badge = this.badgeRepository.create()
          badge.user = { ...(user as User) }
          badge.contact = { ...(contact as Contact) }
          badge.count = 0
          contact.badges.push({ ...badge })
        })
        contacts.push(contact)
      }
    }
    console.log(contacts, '676')
    return contacts
  }

  public async sendNotificationOnRequestAccept(sender: User, target: User) {
    try {
      if (sender.role === Roles.CHILD && target.role === Roles.CHILD) {
        this.socketGateway.handleRequestToContactApproved(
          `${MessagesEnum.CONTACT_APPROVED} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender.id,
        )
        this.socketGateway.handleRequestToContactApproved(
          `${MessagesEnum.CONTACT_APPROVED} ${
            sender.firstName + ' ' + sender.lastName
          }`,
          target.id,
        )
        this.socketGateway.handleRequestToContactApprovedForParents(
          `${MessagesEnum.CONTACT_APPROVED_FOR_PARENTS} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender?.household?.id,
        )
        let senderDevices =
          await this.notificationService.findDeviceTokensForUser([sender])
        let household = await this.householdService.findOne(
          { id: sender.household.id },
          { all: true },
        )
        let parents = household?.users?.filter((user) =>
          [Roles.PARENT as string, Roles.SECOND_PARENT as string].includes(
            user.role,
          ),
        )
        let parentsDevices =
          await this.notificationService.findDeviceTokensForUser(parents)
        await this.notificationService.notifyRequestApproveForParents(
          parentsDevices,
          target,
          sender,
        )
        await this.notificationService.notifyRequestApprove(
          senderDevices,
          target,
        )
      } else if (sender.role === Roles.CHILD && target.role !== Roles.CHILD) {
        this.socketGateway.handleRequestToContactApprovedForParents(
          `${MessagesEnum.CONTACT_APPROVED_FOR_PARENTS} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender?.household?.id,
        )
        this.socketGateway.handleRequestToContactApproved(
          `${MessagesEnum.CONTACT_APPROVED} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender.id,
        )
        let senderDevices =
          await this.notificationService.findDeviceTokensForUser([sender])
        let targetDevices =
          await this.notificationService.findDeviceTokensForUser([target])
        let household = await this.householdService.findOne(
          { id: sender.household.id },
          { all: true },
        )
        let parents = household?.users?.filter((user) =>
          [Roles.PARENT as string, Roles.SECOND_PARENT as string].includes(
            user.role,
          ),
        )
        let parentsDevices =
          await this.notificationService.findDeviceTokensForUser(parents)
        await this.notificationService.notifyRequestApproveForParents(
          parentsDevices,
          target,
          sender,
        )
        await this.notificationService.notifyRequestApprove(
          senderDevices,
          target,
        )
        await this.notificationService.notifyRequestApproveForChild(
          targetDevices,
          sender,
        )
      } else if (sender.role !== Roles.CHILD && target.role === Roles.CHILD) {
        this.socketGateway.handleRequestToContactApprovedForParents(
          `${MessagesEnum.CONTACT_APPROVED_FOR_PARENTS} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender?.household?.id,
        )
        this.socketGateway.handleRequestToContactApproved(
          `${MessagesEnum.CONTACT_APPROVED} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender.id,
        )
        this.socketGateway.handleRequestToContactApproved(
          `${MessagesEnum.CONTACT_APPROVED} ${
            sender.firstName + ' ' + sender.lastName
          }`,
          target.id,
        )
        let senderDevices =
          await this.notificationService.findDeviceTokensForUser([sender])
        let targetDevices =
          await this.notificationService.findDeviceTokensForUser([target])
        await this.notificationService.notifyRequestApproveForChild(
          targetDevices,
          sender,
        )
        await this.notificationService.notifyRequestApprove(
          senderDevices,
          target,
        )
      } else {
        this.socketGateway.handleRequestToContactApproved(
          `${MessagesEnum.CONTACT_APPROVED} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender.id,
        )
        let devices = await this.notificationService.findDeviceTokensForUser([
          sender,
        ])
        await this.notificationService.notifyRequestApprove(
          devices,
          target,
          false,
        )
      }
    } catch (err) {
      console.log(err)
    }
  }

  public async sendNotificationOnRequestDeny(sender: User, target: User) {
    try {
      if (sender.role === Roles.CHILD && target.role === Roles.CHILD) {
        this.socketGateway.handleRequestToContactDenied(
          `${MessagesEnum.CONTACT_DENIED} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender.id,
        )
        this.socketGateway.handleRequestToContactDenied(
          `${MessagesEnum.CONTACT_DENIED} ${
            sender.firstName + ' ' + sender.lastName
          }`,
          target.id,
        )
        this.socketGateway.handleRequestToContactDeniedForParents(
          `${MessagesEnum.CONTACT_DENIED_FOR_PARENTS} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender?.household?.id,
        )
      } else if (sender.role === Roles.CHILD && target.role !== Roles.CHILD) {
        this.socketGateway.handleRequestToContactDeniedForParents(
          `${MessagesEnum.CONTACT_DENIED_FOR_PARENTS} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender?.household?.id,
        )
        this.socketGateway.handleRequestToContactDenied(
          `${MessagesEnum.CONTACT_DENIED} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender.id,
        )
      } else if (sender.role !== Roles.CHILD && target.role === Roles.CHILD) {
        this.socketGateway.handleRequestToContactDeniedForParents(
          `${MessagesEnum.CONTACT_DENIED_FOR_PARENTS} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender?.household?.id,
        )
        this.socketGateway.handleRequestToContactDenied(
          `${MessagesEnum.CONTACT_DENIED} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender.id,
        )
        this.socketGateway.handleRequestToContactDenied(
          `${MessagesEnum.CONTACT_DENIED} ${
            sender.firstName + ' ' + sender.lastName
          }`,
          target.id,
        )
        let senderDevices =
          await this.notificationService.findDeviceTokensForUser([sender])
        let targetDevices =
          await this.notificationService.findDeviceTokensForUser([target])
        await this.notificationService.notifyRequestDenyForChild(
          targetDevices,
          sender,
        )
        await this.notificationService.notifyRequestDeny(senderDevices, target)
      } else {
        this.socketGateway.handleRequestToContactDenied(
          `${MessagesEnum.CONTACT_DENIED} ${
            target.firstName + ' ' + target.lastName
          }`,
          sender.id,
        )
        const devices = await this.notificationService.findDeviceTokensForUser([
          sender,
        ])
        await this.notificationService.notifyRequestDeny(devices, target, false)
      }
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }
}
