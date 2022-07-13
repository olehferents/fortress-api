import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Regex } from 'src/constants/regex'
import { Roles } from 'src/constants/roles.enum'
import { SignUpChildDto } from 'src/modules/auth/sign-up/dto/signUpChild.dto'
import { SignUpOtherDto } from 'src/modules/auth/sign-up/dto/signUpOther.dto'
import { SignUpUserDto } from 'src/modules/auth/sign-up/dto/signUpUser.dto'
import { EditChildProfileDto } from 'src/modules/edit-profile/dto/editChildProfile.dto'
import { EditUserProfileDto } from 'src/modules/edit-profile/dto/editUserProfile.dto'
import { NotificationService } from 'src/modules/notification/notification.service'
import { Connection, Repository } from 'typeorm'
import { ContactService } from '../contact/contact.service'
import { Contact } from '../contact/entity/contact.entity'
import { Household } from '../household/entity/household.entity'
import { HouseholdBadge } from '../household/entity/householdBadge.entity'
import { HouseholdService } from '../household/household.service'
import { CredentialsDto } from './dto/credentials.dto'
import { UserDto } from './dto/user.dto'
import { User } from './entities/user.entity'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @Inject(forwardRef(() => HouseholdService))
    private readonly householdService: HouseholdService,
    @Inject(forwardRef(() => ContactService))
    private readonly contactService: ContactService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
    private readonly connection: Connection,
    @InjectRepository(HouseholdBadge)
    private readonly badgeRepository: Repository<HouseholdBadge>,
  ) {}

  public async create(userDto: SignUpUserDto): Promise<User> {
    return this.userRepository.create(userDto)
  }

  public async update(
    editUserProfileDto?: EditUserProfileDto | EditChildProfileDto,
  ) {
    await this.userRepository.save(editUserProfileDto)
  }

  public async save(user: User) {
    try {
      return await this.userRepository.save(user)
    } catch (err) {
      throw new InternalServerErrorException(err.detail)
    }
  }

  public async getUserProfile(userId: string): Promise<User> {
    let user = await this.findByUniqueFieldWithRelations(
      {
        id: userId,
      },
      ['contacts', 'household', 'primaryAccount', 'inReq', 'outReq'],
    )

    if (!user) {
      throw new NotFoundException('User does not exist!')
    }

    user = this.removeExtraFields(user)
    user?.household
      ? (user.household['messages'] =
          await this.householdService.findMessagesOfHousehold(
            user?.household?.id,
          ))
      : null
    for (let contact of user?.contacts) {
      contact['messages'] = await this.contactService.findMessagesOfContact(
        contact?.id,
      )
    }
    if (user.role === Roles.PARENT || user.role === Roles.SECOND_PARENT) {
      for (let child in user?.household?.users) {
        if (user?.household?.users[child].role === Roles.CHILD) {
          user.household.users[child] =
            await this.findByUniqueFieldWithRelations(
              { id: user?.household?.users[child].id },
              ['contacts'],
            )
          for (let contact in user?.household?.users[child].contacts) {
            user.household.users[child].contacts[contact]['messages'] =
              await this.contactService.findMessagesOfContact(
                user?.household?.users[child].contacts[contact].id,
              )
            user.household.users[child].contacts[contact].users =
              user?.household?.users[child].contacts[contact].users.filter(
                (usr) => usr.id !== user?.household?.users[child].id,
              )
          }
        }
      }
    }
    return user
  }

  public removeExtraFields(user: User): User {
    delete user.password
    user?.household?.users?.forEach((member, index) => {
      member.id === user.id ? delete user.household.users[index] : null
      delete member.password
    })
    user?.household
      ? (user.household.users = user?.household?.users?.filter(
          (user) => user !== null,
        ))
      : null
    user?.contacts?.forEach((contact, index) => {
      contact.users = contact?.users?.filter((usr) => usr.id !== user.id)
    })
    return user
  }

  public async findByUniqueFieldWithRelations(
    { id = null, email = null, phoneNumber = null, username = null }: any,
    relations?: string[],
  ): Promise<User> {
    try {
      const isMissedCalls = !!relations?.includes('missedCalls')
      relations = relations?.filter((r) => r !== 'missedCalls')
      const user = await this.userRepository.findOne({
        where: id
          ? { id }
          : email
          ? { email }
          : phoneNumber
          ? { phoneNumber }
          : username
          ? { username }
          : null,
        relations: relations ? relations : [],
      })
      if (user && isMissedCalls ) {
        let calls = []
        let householdCalls = await this.householdService.findMissedCallsOfHousehold(user?.household?.id)
        householdCalls = householdCalls?.filter(message => message.userId !== user.id)
        householdCalls?.length > 0 ? calls.push(...householdCalls) : null
        for (let contact of user?.contacts) {
          let contactCalls = await this.contactService.findMissedCallsOfContacts(contact.id)
          contactCalls  = contactCalls?.filter(message => message.userId !== user.id)
          calls.push(...contactCalls)
        }
        calls?.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        user['missedCalls'] = calls
      }
      return user
    } catch (err) {
      console.error(err)
      throw new InternalServerErrorException(err)
    }
  }

  public async findByPhoneNumber(phoneNumber: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        phoneNumber,
      },
    })

    // if (!user) {
    //   throw new NotFoundException(`User ${phoneNumber} not found`);
    // }

    return user
  }

  public async findByLogin(login: string): Promise<User> {
    if (Regex.EMAIL.test(login)) {
      return await this.findByUniqueFieldWithRelations(
        { email: login.toLowerCase() },
        ['contacts', 'household', 'primaryAccount', 'inReq', 'outReq'],
      )
    }
    if (Regex.PHONE.test(login[0] === '+' ? login : `+${login}`)) {
      return await this.findByUniqueFieldWithRelations(
        { phoneNumber: login[0] === '+' ? login : `+${login}` },
        ['contacts', 'household', 'primaryAccount', 'inReq', 'outReq'],
      )
    }
    return await this.findByUniqueFieldWithRelations({ username: login }, [
      'contacts',
      'household',
      'primaryAccount',
      'inReq',
      'outReq',
    ])
  }

  public async findByCredentials(credentials: CredentialsDto) {
    let users = []
    if (credentials.login && Regex.EMAIL.test(credentials?.login)) {
      const user = await this.findByUniqueFieldWithRelations(
        {
          email: credentials.login.toLowerCase(),
        },
        ['contacts', 'household', 'primaryAccount', 'inReq', 'outReq'],
      )
      user ? users.push(user) : null
    }
    if (
      credentials.phoneNumber &&
      Regex.PHONE.test(
        credentials?.phoneNumber[0] === '+'
          ? credentials?.phoneNumber
          : `+${credentials?.phoneNumber}`,
      )
    ) {
      const user = await this.findByUniqueFieldWithRelations(
        {
          phoneNumber:
            credentials.phoneNumber[0] === '+'
              ? credentials.phoneNumber
              : `+${credentials.phoneNumber}`,
        },
        ['contacts', 'household', 'primaryAccount', 'inReq', 'outReq'],
      )
      user ? users.push(user) : null
    }
    const user = await this.findByUniqueFieldWithRelations(
      { username: credentials?.login },
      ['contacts', 'household', 'primaryAccount', 'inReq', 'outReq'],
    )
    credentials.login && user ? users.push(user) : null
    if ([...new Set(users.map((user) => user?.id))].length > 1) {
      throw new BadRequestException('Used credentials of different users')
    } else {
      return users[0] ? users[0] : null
    }
  }

  public async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        username,
      },
    })

    // if (!user) {
    //   throw new NotFoundException(`User ${username} not found`);
    // }

    return user
  }

  public async checkPhoneNumber(phoneNumber: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        phoneNumber,
      },
    })

    return user
  }

  public async checkPhoneNumberIsSubaccount(
    phoneNumber: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: {
        phoneNumber,
      },
      relations: ['primaryAccount'],
    })

    if (!user) {
      throw new NotFoundException('User with this phone number does not exist!')
    }

    return user?.primaryAccount ? true : false
  }

  public async checkEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    })

    return user
  }

  public async checkUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        username,
      },
    })

    return user
  }

  public async createParent(parentDto: SignUpUserDto): Promise<UserDto> {
    const queryRunner = this.connection.createQueryRunner()
    try {
      let parent = await this.create(parentDto)
      parent.role = Roles.PARENT
      let household = this.householdService.create()
      household.users = [parent]
      household.badges = []
      let badge = this.badgeRepository.create()
      badge.household = { ...household }
      badge.user = parent
      badge.count = 0
      household.badges.push(badge)
      await queryRunner.connect()
      await queryRunner.startTransaction()
      await queryRunner.manager.save<User>(parent)
      await queryRunner.manager.save<Household>(household)
      await queryRunner.commitTransaction()
      return parent
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw new Error(err?.detail || err?.message)
    } finally {
      await queryRunner.release()
    }
  }

  public async createOther(otherDto: SignUpUserDto): Promise<UserDto> {
    let other = await this.create(otherDto)
    other.role = Roles.OTHER
    await this.save(other)
    return other
  }

  public async createSecondParent(
    parentDto: SignUpOtherDto,
    parent: User,
  ): Promise<UserDto> {
    const queryRunner = this.connection.createQueryRunner()
    try {
      if (!parent?.household)
        throw new NotFoundException(
          `Household for parent ${parent.id} not found`,
        )
      let secondParent = await this.create(parentDto)
      secondParent.role = Roles.SECOND_PARENT
      secondParent.primaryAccount = parent
      parent.household.users.push(secondParent)
      parent.household.hasSecondParent = true
      secondParent.household = { ...parent.household }
      let badge = this.badgeRepository.create()
      badge.household = { ...parent.household }
      badge.user = secondParent
      badge.count = 0
      parent.household.badges.push(badge)
      let householdContacts =
        await this.contactService.createContactsBetweenHouseholdMembers(
          parent.household,
          secondParent,
        )
      await queryRunner.connect()
      await queryRunner.startTransaction()
      await queryRunner.manager.save<User[]>([secondParent, parent])
      // await queryRunner.manager.save<Household>(parent.household)
      await queryRunner.manager.save<Contact[]>(householdContacts)
      await queryRunner.commitTransaction()
      await this.notificationService.notifyNewHouseholdMember(
        await this.notificationService.findDeviceTokensForUser(
          parent.household.users,
        ),
        secondParent,
      )
      return secondParent
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(err.detail)
    } finally {
      await queryRunner.release()
    }
  }

  public async createChild(
    childDto: SignUpChildDto,
    parent: User,
  ): Promise<UserDto> {
    const queryRunner = this.connection.createQueryRunner()
    try {
      let household
      let child = await this.create(childDto)
      child.role = Roles.CHILD
      child.primaryAccount = parent
      if (parent.role !== Roles.PARENT) {
        parent.role = Roles.PARENT
        household = this.householdService.create()
        household.users = [parent, child]
        parent.household = {...household}
      } else {
        parent.household.users.push(child)
      }
      child.household = {...parent.household}
      let badge = this.badgeRepository.create()
      badge.household = parent.household
      badge.user = child
      badge.count = 0
      parent.household.badges = []
      parent.household.badges.push(badge)
      let householdContacts =
        await this.contactService.createContactsBetweenHouseholdMembers(
          parent.household,
          child,
        )
      await queryRunner.connect()
      await queryRunner.startTransaction()
      await queryRunner.manager.save<User[]>([child, parent])
      // await queryRunner.manager.save<Household>(parent.household)
      await queryRunner.manager.save<Contact[]>(householdContacts)
      await queryRunner.commitTransaction()
      await this.notificationService.notifyNewHouseholdMember(
        await this.notificationService.findDeviceTokensForUser(
          parent.household.users,
        ),
        child,
      )
      return child
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw new ConflictException(err)
    } finally {
      await queryRunner.release()
    }
  }

  public async createTeenager(
    teenagerDto: SignUpChildDto,
    parent: User,
  ): Promise<UserDto> {
    const queryRunner = this.connection.createQueryRunner()
    try {
      let household
      let teenager = await this.create(teenagerDto)
      teenager.role = Roles.TEENAGER
      teenager.primaryAccount = parent
      if (parent.role !== Roles.PARENT) {
        parent.role = Roles.PARENT
        household = this.householdService.create()
        household.users = [parent, teenager]
        parent.household = { ...household }
      } else {
        parent.household.users.push(teenager)
      }
      teenager.household = {...parent.household}
      let badge = this.badgeRepository.create()
      badge.household = parent.household
      badge.user = teenager
      badge.count = 0
      parent.household.badges.push(badge)
      teenager.household = { ...parent.household }
      let householdContacts =
        await this.contactService.createContactsBetweenHouseholdMembers(
          parent.household,
          teenager,
        )
      await queryRunner.connect()
      await queryRunner.startTransaction()
      await queryRunner.manager.save<User[]>([teenager, parent])
      // await queryRunner.manager.save<Household>(parent.household)
      await queryRunner.manager.save<Contact[]>(householdContacts)
      await queryRunner.commitTransaction()
      await this.notificationService.notifyNewHouseholdMember(
        await this.notificationService.findDeviceTokensForUser(
          parent.household.users,
        ),
        teenager,
      )
      return teenager
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw new InternalServerErrorException(err)
    } finally {
      await queryRunner.release()
    }
  }
}
