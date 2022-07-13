import { Body, Controller, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBadRequestResponse, ApiOkResponse, ApiNotFoundResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from 'src/constants/roles.enum';
import { RolesGuard } from 'src/helpers/guards/roles.guard';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ResetPasswordService } from './reset-password.service';

@ApiTags('Reset Password')
@Controller('/auth')
export class ResetPasswordController {
  constructor(private readonly resetPasswordService: ResetPasswordService) {}
  

  @ApiBadRequestResponse({ description: 'Email/phone number should be valid' })
  @ApiOkResponse({ description: 'Message with reset password link sent successfully' })
  @ApiNotFoundResponse({
    description: 'This email/phone number is not registered yet',
  })
  @ApiUnauthorizedResponse({
    description: 'Email/phone number or password is incorrect!',
  })
  @Post('/reset-password/send-request')
  public async forgotPassword(
      @Body() forgotPasswordDto: ForgotPasswordDto,
      @Res() res
  ): Promise<void> {
      try {
        await this.resetPasswordService.sendForgotPasswordRequest(forgotPasswordDto)

        res
          .status(HttpStatus.OK)
          .json({message: 'Email with new password was sent if such user exists!'})
      } catch (err) {
          res.status(err.status || HttpStatus.BAD_REQUEST).json({message: err.message})
      }
  }

  @ApiBadRequestResponse({ description: 'Email/phone number should be valid' })
  @ApiOkResponse({ description: 'Message with reset password link sent successfully' })
  @ApiNotFoundResponse({
    description: 'This email/phone number is not registered yet',
  })
  @ApiUnauthorizedResponse({
    description: 'Email/phone number or password is incorrect!',
  })
  @UseGuards(AuthGuard('jwt'))
  @Post('/change-password')
  public async changePassword(
      @Body() changePasswordDto: ChangePasswordDto,
      @Res() res,
      @Req() req
  ): Promise<void> {
      try {
        if (!changePasswordDto.childId) {
          await this.resetPasswordService.changePassword(changePasswordDto, req.user)
        } else {
          await this.resetPasswordService.changePasswordForChild(changePasswordDto, req.user)

        }

        res
          .status(HttpStatus.OK)
          .json({message: 'Password was changed successfully'})
      } catch (err) {
          res.status(err.status || HttpStatus.BAD_REQUEST).json({message: err.message})
      }
  }
}
