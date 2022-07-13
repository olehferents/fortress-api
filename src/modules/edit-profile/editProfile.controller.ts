import { Body, Controller, HttpStatus, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiConsumes, ApiNoContentResponse, ApiPayloadTooLargeResponse, ApiTags, ApiUnsupportedMediaTypeResponse } from '@nestjs/swagger';
import { SwaggerMessagesEnum } from 'src/constants/messagesEnum/swaggerMessages.enum';
import { Roles } from 'src/constants/roles.enum';
import { RolesGuard } from 'src/helpers/guards/roles.guard';
import { FileUploadService } from '../file-upload/file-upload.service';
import { EditChildProfileDto } from './dto/editChildProfile.dto';
import { EditUserProfileDto } from './dto/editUserProfile.dto';
import { EditProfileService } from './editProfile.service';

@ApiConflictResponse({ description: 'Email or phoneNumber or username already exists!' })
@ApiBadRequestResponse({
  description: SwaggerMessagesEnum.API_BAD_REQUEST_RESPONSE,
})
@ApiPayloadTooLargeResponse({
  description: SwaggerMessagesEnum.API_PAYLOAD_TOO_LARGE_RESPONSE,
})
@ApiUnsupportedMediaTypeResponse({
  description: SwaggerMessagesEnum.API_UNSUPPORTED_MEDIA_TYPE_RESPONSE,
})
@ApiNoContentResponse({description: 'Profile updated successfully!'})
@ApiBearerAuth()
@UseInterceptors(FileInterceptor('profileImage'))
@ApiConsumes('multipart/form-data')
@Controller('edit-profile')
export class EditProfileController {
  constructor (
    private editProfileService: EditProfileService,
    private jwtService: JwtService,
    private fileUploadService: FileUploadService
    ) {}

  @ApiTags('User')
  @Put()
  @UseGuards(AuthGuard('jwt'), RolesGuard([Roles.PARENT, Roles.SECOND_PARENT, Roles.OTHER, Roles.TEENAGER]))
  public async editUserProfile(
      @Body() editUserProfileDto: EditUserProfileDto,
      @UploadedFile() profileImage,
      @Req() req,
      @Res() res,
  ): Promise<void> {
      try {
        if (profileImage) {
          this.fileUploadService.isFileValid(profileImage);
          profileImage.originalname = Date.now() + profileImage.originalname.replace(/\s/g, '_');
          editUserProfileDto.profileImage =
            process.env.S3_BUCKET_URL_PROFILE_IMAGES + profileImage.originalname;
        }

        await this.editProfileService.user(req.user, editUserProfileDto)

        if (profileImage) {
          await this.fileUploadService.upload(
            profileImage,
            process.env.S3_BUCKET_NAME_PROFILE_IMAGES,
          );
        }

        res.status(HttpStatus.NO_CONTENT).send()
      } catch (err) {
        res
          .status(err?.status || HttpStatus.CONFLICT)
          .json({ message: err?.detail || err?.message });
      }
  }

  @ApiTags('Child')
  @Put('child')
  @UseGuards(AuthGuard('jwt'), RolesGuard([Roles.CHILD]))
  public async editChildProfile(
    @Req() req,
    @Res() res,
    @UploadedFile() profileImage,
    @Body() editChildProfileDto: EditChildProfileDto,
  ): Promise<void> {
      try {
        if (profileImage) {
          this.fileUploadService.isFileValid(profileImage);
          profileImage.originalname = Date.now() + profileImage.originalname.replace(/\s/g, '_');
          editChildProfileDto.profileImage =
            process.env.S3_BUCKET_URL_PROFILE_IMAGES + profileImage.originalname;
        }

        await this.editProfileService.child(req.user, editChildProfileDto)

        if (profileImage) {
          await this.fileUploadService.upload(
            profileImage,
            process.env.S3_BUCKET_NAME_PROFILE_IMAGES,
          );
        }

        res.status(HttpStatus.NO_CONTENT).send()
      } catch (err) {
        res
          .status(err.status || HttpStatus.CONFLICT)
          .json({ message: err?.detail || err?.message });
      }
  }
}
