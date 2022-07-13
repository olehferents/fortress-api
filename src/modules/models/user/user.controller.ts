import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { MessagesEnum } from 'src/constants/messagesEnum/messages.enum';
import { Regex } from 'src/constants/regex';
import { Roles } from 'src/constants/roles.enum';
import { RolesGuard } from 'src/helpers/guards/roles.guard';
import { HouseholdService } from 'src/modules/models/household/household.service';
import { ContactService } from '../contact/contact.service';
import { CredentialsDto } from './dto/credentials.dto';
import { UserService } from './user.service';

@ApiTags('User')
@ApiUnauthorizedResponse({ description: 'Provide valid access token!' })
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly contactService: ContactService,
    private readonly householdService: HouseholdService,
  ) {}

  // @UseInterceptors(ClassSerializerInterceptor)


  @Get('/profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Profile returned successfully!' })
  public async getUser(@Req() req, @Res() res): Promise<void> {
    try {

      let user = await this.userService.getUserProfile(req.user.id);
      

      res.status(HttpStatus.OK).json(user);
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }

  @ApiCreatedResponse({ description: 'You can create account with this phone number!' })
  @ApiBadRequestResponse({ description: 'Phone not valid!' })
  @ApiConflictResponse({description: 'You can not create account with this phone number as its already registered!'})
  @ApiQuery({ name: 'phone', enum: ['380665551799'] })
  @Get('/checkphone')
  public async checkPhone(@Res() res, @Query('phone') phone): Promise<void> {
    try {
      if (!Regex.PHONE.test(`+${phone}`)) {
        throw new BadRequestException('Phone not valid!');
      }
      let user = await this.userService.checkPhoneNumber(`+${phone}`);

      res.status(user && phone ? HttpStatus.CONFLICT : HttpStatus.OK).json({
        message:
          user && phone
            ? MessagesEnum.PHONE_NUMBER_REGISTERED
            : MessagesEnum.PHONE_NUMBER_AVAILABLE,
      });
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }

  @ApiNotFoundResponse({ description: 'User with this phone number does not exist!'})
  @ApiBadRequestResponse({ description: 'Phone not valid!'})
  @ApiOkResponse({ description: 'User is subaccount | User is not subaccount' })
  @ApiQuery({ name: 'phone', type: 'string'})
  @Get('/checkphoneissub')
  public async checkPhoneIsSubaccount(
    @Res() res,
    @Query('phone') phone,
  ): Promise<void> {
    try {
      if (!Regex.PHONE.test(`+${phone}`)) {
        throw new BadRequestException('Phone not valid!');
      }
      const isSub = await this.userService.checkPhoneNumberIsSubaccount(
        `+${phone}`,
      );

      res.status(HttpStatus.OK).json({
        message: isSub
          ? MessagesEnum.USER_IS_SUBACCOUNT
          : MessagesEnum.USER_IS_NOT_SUBACCOUNT,
      });
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'You can create account with this email!' })
  @ApiBadRequestResponse({ description: 'Email not valid!' })
  @ApiConflictResponse({ description: 'You can not create account with this email as its already registered!'})
  @ApiQuery({ name: 'email', type: 'string'})
  @Get('/checkemail')
  public async checkEmail(@Res() res, @Query('email') email): Promise<void> {
    try {
      if (!Regex.EMAIL.test(email)) {
        throw new BadRequestException('Email not valid!');
      }
      let user = await this.userService.checkEmail(email);

      res.status(user && email ? HttpStatus.CONFLICT : HttpStatus.OK).json({
        message:
          user && email
            ? MessagesEnum.EMAIL_REGISTERED
            : MessagesEnum.EMAIL_AVAILABLE,
      });
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'You can create account with this username!' })
  @ApiConflictResponse({ description: 'You can not create account with this username as its already registered!'})
  @ApiQuery({ name: 'username', type: 'string'})
  @Get('/checkusername')
  public async checkUsername(
    @Res() res,
    @Query('username') username,
  ): Promise<void> {
    try {
      let user = await this.userService.checkUsername(username);

      res.status(user && username ? HttpStatus.CONFLICT : HttpStatus.OK).json({
        message:
          user && username
            ? MessagesEnum.USERNAME_REGISTERED
            : MessagesEnum.USERNAME_AVAILABLE,
      });
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'User found!' })
  @ApiNotFoundResponse({ description: 'User not found!' })
  @ApiBadRequestResponse({ description: 'Login was not provided!'})
  @ApiQuery({ name: 'username', type: 'string', description: 'You'})
  @Get('/find')
  public async findUser(@Res() res, @Query('login') login): Promise<void> {
    try {

      if (!login) 
        throw new BadRequestException('Login was not provided!');

      let user = await this.userService.findByLogin(login);

      if (!user) 
        throw new NotFoundException('User not found!');

      res.status(HttpStatus.OK).json({ user });
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'User(s) found!' })
  @ApiNotFoundResponse({ description: 'User(s) not found!' })
  @ApiBadRequestResponse({ description: 'Credentials were not provided!'})
  @UseGuards(AuthGuard('jwt'))
  @Post('/findbycredentials')
  public async findUserByCredentials(
    @Res() res,
    @Body() credentials: CredentialsDto,
  ): Promise<void> {
    try {

      if (!credentials.login && !credentials.phoneNumber)
        throw new BadRequestException('Credentials were not provided!');

      let user = await this.userService.findByCredentials(credentials);

      if (!user) {
        throw new NotFoundException('User not found!');
      }

      res.status(HttpStatus.OK).json({ user });
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }
}
