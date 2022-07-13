import { Body, ClassSerializerInterceptor, Controller, HttpStatus, Param, Post, Res, UseInterceptors } from '@nestjs/common';
import {
  ApiParam,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { classToPlain } from 'class-transformer';
import { MessagesEnum } from 'src/constants/messagesEnum/messages.enum';
import { Device } from 'src/modules/notification/entity/device.entity';
import { Repository } from 'typeorm';
import { TokenService } from '../tokens/token.service';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { SignInDto } from './dto/signIn.dto';
import { SignOutDto } from './dto/signOut.dto';
import { SignInService } from './signIn.service';

@ApiTags('Sign In')
@ApiBadRequestResponse({ description: 'Email/phone number should be valid' })
@ApiOkResponse({ description: 'Successfully signed in' })
@ApiNotFoundResponse({
  description: 'This email/phone number is not registered yet',
})
@ApiUnauthorizedResponse({
  description: 'Email/phone number/username or password is incorrect!',
})
@UseInterceptors(ClassSerializerInterceptor)
@Controller('/auth/signin')
export class SignInController {
  constructor(
    private readonly signInService: SignInService,
    private readonly tokenService: TokenService,

    ) {}

  @Post()
  public async signIn(
    @Body() signInUserDto: SignInDto,
    @Res() res,
  ): Promise<void> {
    console.log(signInUserDto);
    try {
      const response = await this.signInService.signInUser(signInUserDto);

      res
        .status(response?.status ? response.status : HttpStatus.OK)
        .json({
          message: response?.message,
          accessToken: response?.accessToken,
          refreshToken: response?.refreshToken,
          user: response?.user,
        });
    } catch (err) {
      console.log(err, "ERROR")
      res
        .status(err?.status || HttpStatus.BAD_REQUEST)
        .json({ message: err?.message });
    }
  }

  @Post('signout')
  public async signOut(
    @Body() signOutUserDto: SignOutDto,
    @Res() res,
  ): Promise<void> {
    try {
      const response = await this.signInService.signOut(signOutUserDto);

      res
        .status(response?.status ? response.status : HttpStatus.OK)
        .json({
          message: response?.message,
          accessToken: response?.accessToken,
          refreshToken: response?.refreshToken,
          user: response?.user,
        });
    } catch (err) {
      res
        .status(err?.status || HttpStatus.BAD_REQUEST)
        .json({ message: err?.message });
    }
  }

  @Post('child')
  public async signInChild(
    @Body() signInChildDto: SignInDto,
    @Res() res,
  ): Promise<void> {
    try {
      const response = await this.signInService.signInChild(signInChildDto);

      res
        .status(HttpStatus.OK)
        .json({
          message: response?.message,
          accessToken: response?.accessToken,
          refreshToken: response?.refreshToken,
          user: response?.user,
        });
    } catch (err) {
      res
        .status(err?.status || HttpStatus.BAD_REQUEST)
        .json({ message: err?.message || MessagesEnum.SIGN_IN_FAILED });
    }
  }

  @Post('refresh')
  public async refreshToken(
    @Body(){refreshToken}: RefreshTokenDto,
    @Res() res,
  ): Promise<void> {
    try {
      const {accessToken, newRefreshToken} = await this.tokenService.createAccessTokenFromRefreshToken(refreshToken);
      res
        .status(HttpStatus.OK)
        .json({accessToken, refreshToken: newRefreshToken});
    } catch (err) {
      res
        .status(err?.status || HttpStatus.BAD_REQUEST)
        .json({ message: err?.message });
    }
  }
}
