import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { MessagesEnum } from 'src/constants/messagesEnum/messages.enum'
import { Regex } from 'src/constants/regex'
import * as bcrypt from 'bcryptjs'
import { SignInDto } from './dto/signIn.dto'
import { JwtPayloadInterface } from './interfaces/jwt.payload.interface'
import { UserService } from 'src/modules/models/user/user.service'
import { Roles } from 'src/constants/roles.enum'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ResponseDto } from '../dtoResponse/response.dto'
import { User } from 'src/modules/models/user/entities/user.entity'
import { ContactService } from 'src/modules/models/contact/contact.service'
import { HouseholdService } from 'src/modules/models/household/household.service'
import { TokenService } from '../tokens/token.service'
import { SignOutDto } from './dto/signOut.dto'
import { Device } from 'src/modules/notification/entity/device.entity'

@Injectable()
export class SignInService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly contactService: ContactService,
    private readonly householdService: HouseholdService,
    private readonly tokenService: TokenService,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  public async signIn(signInUserDto: SignInDto): Promise<User> {
    try {
      let user: User
      if (Regex.EMAIL.test(signInUserDto.login)) {
        user = await this.userService.findByUniqueFieldWithRelations(
          {
            email: signInUserDto.login.toLowerCase(),
          },
          [
            'contacts',
            'contacts.users',
            'household',
            'household.users',
            'household.users.contacts',
            'primaryAccount',
            'inReq',
            'outReq',
            'missedCalls',
          ],
        )
      } else if (
        Regex.PHONE.test(
          signInUserDto.login[0] === '+'
            ? signInUserDto.login
            : `+${signInUserDto.login}`,
        )
      ) {
        user = await this.userService.findByUniqueFieldWithRelations(
          {
            phoneNumber:
              signInUserDto.login[0] === '+'
                ? signInUserDto.login
                : `+${signInUserDto.login}`,
          },
          [
            'contacts',
            'contacts.users',
            'household',
            'household.users',
            'household.users.contacts',
            'primaryAccount',
            'inReq',
            'outReq',
            'missedCalls',
          ],
        )
      } else {
        user = await this.userService.findByUniqueFieldWithRelations(
          {
            username: signInUserDto.login.toLowerCase(),
          },
          [
            'contacts',
            'contacts.users',
            'household',
            'household.users',
            'household.users.contacts',
            'primaryAccount',
            'inReq',
            'outReq',
            'missedCalls',
          ],
        )
      }
      if (!user || user.isSuspended) {
        throw new UnauthorizedException(MessagesEnum.USER_NOT_FOUND)
      }
      if (!(await bcrypt.compare(signInUserDto.password, user.password))) {
        throw new UnauthorizedException(MessagesEnum.SIGN_IN_FAILED)
      }
      user.isActive = true
      user = await this.userService.save(user)
      let device = await this.deviceRepository.findOne({
        where: { token: signInUserDto.deviceToken },
      })
      if (device) {
        device.notify = true
        await this.deviceRepository.save(device)
      }
      return user
    } catch (err) {
      console.error(err)
      throw new InternalServerErrorException(err)
    }
  }

  public async signInUser(signInUserDto: SignInDto): Promise<ResponseDto> {
    try {
      let user: User = await this.signIn(signInUserDto)
      if (user?.role && user?.role === Roles.CHILD) {
        throw new UnauthorizedException(
          'Please use child app to log in or ask your parents to help you!',
        )
      }
      let {
        household,
        contacts,
        primaryAccount,
        devices,
        outReq,
        inReq,
        ...simpleUser
      } = user
      const accessToken = await this.tokenService.generateAccessToken(simpleUser)
      const refreshToken = await this.tokenService.generateRefreshToken(
        simpleUser as User,
        60 * 60 * 24 * 30,
      )
      user = this.userService.removeExtraFields(user)
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
              await this.userService.findByUniqueFieldWithRelations(
                { id: user?.household?.users[child]?.id },
                ['contacts', 'contacts.users'],
              )
            for (let contact in user?.household?.users[child].contacts) {
              user.household.users[child].contacts[contact]['messages'] =
                await this.contactService.findMessagesOfContact(
                  user.household.users[child].contacts[contact].id,
                )
              user.household.users[child].contacts[contact].users =
                user.household.users[child].contacts[contact].users?.filter(
                  (usr) => usr.id !== user?.household?.users[child].id,
                )
            }
          }
        }
      }
      return {
        accessToken,
        refreshToken,
        user,
        status: HttpStatus.OK,
      }
    } catch (err) {
      console.error(err)
      throw new InternalServerErrorException(err)
    }
  }

  public async signInChild(signInUserDto: SignInDto): Promise<ResponseDto> {
    try {
      let user = await this.signIn(signInUserDto)
      if (user?.role && user?.role !== Roles.CHILD) {
        throw new UnauthorizedException('Please use parent app to log in!')
      }
      let {
        household,
        contacts,
        primaryAccount,
        devices,
        outReq,
        inReq,
        ...simpleUser
      } = user
      const accessToken = await this.tokenService.generateAccessToken(
        simpleUser,
      )
      const refreshToken = await this.tokenService.generateRefreshToken(
        simpleUser as User,
        60 * 60 * 24 * 30,
      )
      user = this.userService.removeExtraFields(user)
      user.household
        ? (user.household['messages'] =
            await this.householdService.findMessagesOfHousehold(
              user?.household?.id,
            ))
        : null
      for (let contact of user.contacts) {
        contact['messages'] = await this.contactService.findMessagesOfContact(
          contact.id,
        )
      }
      return {
        accessToken,
        refreshToken,
        user,
        status: HttpStatus.OK,
      }
    } catch (err) {
      throw new UnauthorizedException(err)
    }
  }

  public async signOut(signOutUserDto: SignOutDto): Promise<any> {
    try {
      let device = await this.deviceRepository.findOne({
        where: { token: signOutUserDto.deviceToken },
      })
      if (device) {
        device.notify = false
        await this.deviceRepository.save(device)
      }
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }
}
