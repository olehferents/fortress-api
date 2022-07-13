import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConflictResponse, ApiBadRequestResponse, ApiPayloadTooLargeResponse, ApiUnsupportedMediaTypeResponse, ApiConsumes, ApiTags, ApiCreatedResponse, ApiForbiddenResponse, ApiQuery, ApiParam, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { MessagesEnum } from 'src/constants/messagesEnum/messages.enum';
import { SwaggerMessagesEnum } from 'src/constants/messagesEnum/swaggerMessages.enum';
import { Regex } from 'src/constants/regex';
import { Roles } from 'src/constants/roles.enum';
import { RolesGuard } from 'src/helpers/guards/roles.guard';
import { FileUploadService } from 'src/modules/file-upload/file-upload.service';
import { User } from 'src/modules/models/user/entities/user.entity';
import { UserService } from 'src/modules/models/user/user.service';
import { SignUpChildDto } from './dto/signUpChild.dto';
import { SignUpOtherDto } from './dto/signUpOther.dto';
import { SignUpParentDto } from './dto/signUpParent.dto';
import { SignUpSecondParentDto } from './dto/signUpSecondParent.dto';
import { SignUpService } from './signUp.service';

@ApiConflictResponse({ description: 'Email or phoneNumber already exists!' })
@ApiBadRequestResponse({
  description: SwaggerMessagesEnum.API_BAD_REQUEST_RESPONSE,
})
@ApiPayloadTooLargeResponse({
  description: SwaggerMessagesEnum.API_PAYLOAD_TOO_LARGE_RESPONSE,
})
@ApiUnsupportedMediaTypeResponse({
  description: SwaggerMessagesEnum.API_UNSUPPORTED_MEDIA_TYPE_RESPONSE,
})
@ApiConsumes('multipart/form-data')
@UseInterceptors(FileInterceptor('profileImage'))
@Controller('/auth/signup')
export class SignUpController {
  constructor(
    private signUpService: SignUpService,
    private userService: UserService,
    private fileUploadService: FileUploadService,
  ) {}



  @ApiCreatedResponse({ description: 'Verification code sent!' })
  @ApiBadRequestResponse({description: 'Invalid parameter "TO"'})
  @ApiTags('Sign Up')
  @ApiQuery({ name: 'phone', type: 'string', description: 'Valid phone number' })
  @Get('verifyphone')
  public async verifyPhone(
    @Res() res,
    @Query('phone') phone
  ): Promise<void> {
    try {

      await this.signUpService.sendVerificationSMS(`+${phone}`)

      res.status(HttpStatus.OK).json({
        message: MessagesEnum.VERIFICATION_CODE_SENT,
      });
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }

  @ApiCreatedResponse({ description: 'Verification code sent!' })
  @ApiBadRequestResponse({description: 'Invalid parameter "TO"'})
  @ApiForbiddenResponse({description: 'Verification failed. Wrong verification code'})
  @ApiTags('Sign Up')
  @ApiQuery({ name: 'phone', type: 'string', description: 'Valid phone number' })
  @ApiQuery({ name : 'code', type: 'string', description: 'Verification code from SMS'})
  @Get('verificationcheck')
  public async verificationCheck(
    @Res() res,
    @Query('phone') phone,
    @Query('code') code
  ): Promise<void> {
    try {
      const status = await this.signUpService.checkVerificationCode(`+${phone}`, code)
      res.status(status === 'approved' ? HttpStatus.OK : HttpStatus.FORBIDDEN).json({
        message: status === 'approved' ? MessagesEnum.VERIFICATION_CODE_APPROVED : MessagesEnum.WRONG_VERIFICATION_CODE,
      });
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }

  @ApiCreatedResponse({ description: 'Congrats, new parent created!' })
  @ApiTags('Sign Up')
  @Post('parent')
  public async registerParent(
    @Res() res,
    @UploadedFile() profileImage,
    @Body() signupParentDto: SignUpParentDto,
  ): Promise<void> {
    try {
      if (profileImage) {
        this.fileUploadService.isFileValid(profileImage);
        profileImage.originalname = Date.now() + profileImage.originalname;
        signupParentDto.profileImage =
          process.env.S3_BUCKET_URL_PROFILE_IMAGES + profileImage.originalname.replace(/\s/g, '_');
      }

      await this.signUpService.signUpParent(signupParentDto);

      if (profileImage) {
        await this.fileUploadService.upload(
          profileImage,
          process.env.S3_BUCKET_NAME_PROFILE_IMAGES,
        );
      }

      res.status(HttpStatus.CREATED).json({
        message: MessagesEnum.NEW_PARENT_CREATED,
      });
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }

  @ApiCreatedResponse({ description: 'Congrats, new villager created!' })
  @ApiTags('Sign Up')
  @Post('other')
  public async registerOther(
    @Res() res,
    @UploadedFile() profileImage,
    @Body() signupOtherDto: SignUpOtherDto,
  ): Promise<void> {
    try {
      if (profileImage) {
        this.fileUploadService.isFileValid(profileImage);
        profileImage.originalname = Date.now() + profileImage.originalname;
        signupOtherDto.profileImage =
          process.env.S3_BUCKET_URL_PROFILE_IMAGES + profileImage.originalname.replace(/\s/g, '_');
      }


      await this.signUpService.signUpOther(signupOtherDto);

      if (profileImage) {
        await this.fileUploadService.upload(
          profileImage,
          process.env.S3_BUCKET_NAME_PROFILE_IMAGES,
        );
      }

      res.status(HttpStatus.CREATED).json({
        message: MessagesEnum.NEW_OTHER_CREATED,
      });
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }

  // @ApiCreatedResponse({ description: 'Congrats, new parent created!' })
  // @ApiTags('Sign Up')
  // @Post('second-parent')
  // public async registerSecondParent(
  //   @Res() res,
  //   @UploadedFile() profileImage,
  //   @Body() signUpSecondParentDto: SignUpSecondParentDto,
  // ): Promise<void> {
  //   try {
  //     if (profileImage) {
  //       this.fileUploadService.isFileValid(profileImage);
  //       profileImage.originalname = Date.now() + profileImage.originalname;
  //       signUpSecondParentDto.profileImage =
  //         process.env.S3_BUCKET_URL_PROFILE_IMAGES + profileImage.originalname.replace(/\s/g, '_');
  //     }

  //     await this.signUpService.signUpSecondParent(signUpSecondParentDto);

  //     if (profileImage) {
  //       await this.fileUploadService.upload(
  //         profileImage,
  //         process.env.S3_BUCKET_NAME_PROFILE_IMAGES,
  //       );
  //     }

  //     res.status(HttpStatus.CREATED).json({
  //       message: MessagesEnum.NEW_PARENT_CREATED,
  //     });
  //   } catch (err) {
  //     res
  //       .status(err.status || HttpStatus.CONFLICT)
  //       .json({ message: err.detail || err.message });
  //   }
  // }



  @ApiCreatedResponse({ description: 'Congrats, new child created!' })
  @ApiTags('Sign Up')
  @ApiParam({ name: 'role', enum: [Roles.PARENT, Roles.OTHER] })
  @UseGuards(AuthGuard('jwt'), RolesGuard([Roles.PARENT, Roles.OTHER]))
  @Post('child')
  public async registerChild(
    @Req() req,
    @Res() res,
    @UploadedFile() profileImage,
    @Body() signupChildDto: SignUpChildDto,
  ): Promise<void> {
    try {
      if (profileImage) {
        this.fileUploadService.isFileValid(profileImage);
        profileImage.originalname = Date.now() + profileImage.originalname;
        signupChildDto.profileImage =
          process.env.S3_BUCKET_URL_PROFILE_IMAGES + profileImage.originalname.replace(/\s/g, '_');
      }

      await this.signUpService.signUpChild(signupChildDto, req.user);

      if (profileImage) {
        await this.fileUploadService.upload(
          profileImage,
          process.env.S3_BUCKET_NAME_PROFILE_IMAGES,
        );
      }

      res
        .status(HttpStatus.CREATED)
        .json({message: MessagesEnum.NEW_CHILD_CREATED});
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message});
    }
  }

  @ApiCreatedResponse({ description: 'Congrats, new child created!' })
  @ApiTags('Sign Up')
  @ApiParam({ name: 'role', enum: [Roles.PARENT] })
  @UseGuards(AuthGuard('jwt'), RolesGuard([Roles.PARENT]))
  @Post('teenager')
  public async registerTeenager(
    @Req() req,
    @Res() res,
    @UploadedFile() profileImage,
    @Body() signupTeenagerDto: SignUpChildDto,
  ): Promise<void> {
    try {
      if (profileImage) {
        this.fileUploadService.isFileValid(profileImage);
        profileImage.originalname = Date.now() + profileImage.originalname;
        signupTeenagerDto.profileImage =
          process.env.S3_BUCKET_URL_PROFILE_IMAGES + profileImage.originalname.replace(/\s/g, '_');
      }

      await this.signUpService.signUpTeenager(signupTeenagerDto, req.user);

      if (profileImage) {
        await this.fileUploadService.upload(
          profileImage,
          process.env.S3_BUCKET_NAME_PROFILE_IMAGES,
        );
      }

      res
        .status(HttpStatus.CREATED)
        .json({message: MessagesEnum.NEW_TEEN_CREATED});
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }
}
