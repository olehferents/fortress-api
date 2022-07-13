import { BadRequestException, Body, Controller, forwardRef, Get, HttpStatus, Inject, NotFoundException, Post, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { multerOptions } from 'src/constants/constant';
import { Roles } from 'src/constants/roles.enum';
import { RolesGuard } from 'src/helpers/guards/roles.guard';
import { SocketGateway } from '../../socket/socket.gateway';
import { FileUploadService } from '../../file-upload/file-upload.service';
import { HouseholdMessageDto } from './dto/householdMessage.dto';
import { HouseholdService } from './household.service';
import { CredentialsDto } from '../user/dto/credentials.dto';
import { VideoChatRequestDto } from './dto/videoChatRequest.dto';
import { ContactService } from '../contact/contact.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { User } from '../user/entities/user.entity';

@ApiTags('Household')
@ApiBearerAuth()
@ApiUnauthorizedResponse({description: 'Provide valid access token!'})
@ApiForbiddenResponse({ description: 'Not enough permissions to perform this action!'})
@Controller('household')
@UseGuards(AuthGuard('jwt'), RolesGuard([Roles.CHILD, Roles.TEENAGER, Roles.PARENT, Roles.SECOND_PARENT]))
export class HouseholdController {
  constructor(
    private readonly householdService: HouseholdService,
    private readonly uploadService: FileUploadService,
    private readonly socketGateway: SocketGateway,
    private readonly contactService: ContactService,
    private readonly notificationService: NotificationService,
    ) {}




  @ApiOkResponse({ description: 'Message sent successfully!'})
  @ApiBadRequestResponse({ 
    description: 'Message OR messageVoice OR messageImages OR messageDocuments are required | ' +
                 'Forbidden to send both message and messageVoice'
  })
  @Post('message/send')
  @UseInterceptors(FileFieldsInterceptor([
    {name:'messageImages', maxCount: 10}, 
    {name: 'messageVoice', maxCount: 1}, 
    {name: 'messageDocuments', maxCount: 10},
  ], multerOptions))
  public async sendMessage(
    @Req() req, 
    @Res() res,
    @Body() messageDto: HouseholdMessageDto,
    @UploadedFiles() {
      messageImages = null, messageVoice = null, 
      messageDocuments = null
    }: any,
    ): Promise<void> {
    try {
      if (!messageDto.body && !messageVoice?.length && !messageImages?.length && !messageDocuments?.length) {
        throw new BadRequestException('Message OR messageVoice OR messageImages OR messageDocuments are required')
      }

      if (messageDto.body && messageVoice?.length) {
        throw new BadRequestException('Forbidden to send both message and messageVoice')
      }

      messageDto.userId = req.user.id
      messageDto.householdId = req.user.household.id
      messageImages ? messageDto.messageImages = [] : null
      messageDocuments ? messageDto.messageDocuments = [] : null

      if (messageVoice) {
        this.uploadService.isAudioValid(messageVoice[0])
        messageVoice[0].originalname = (Date.now() + messageVoice[0].originalname).replace(/ /g, '_')
        messageDto.messageVoice = process.env.S3_BUCKET_URL_HOUSEHOLD_STATIC_FILES + req.user.household.id 
          + `/${process.env.S3_BUCKET_KEY_VOICE_MESSAGES}/` + messageVoice[0].originalname
        this.uploadService.uploadHouseholdVoiceMessage(
          messageVoice[0],
          process.env.S3_BUCKET_NAME_HOUSEHOLD_STATIC_FILES,
          req.user.household.id
        )
      }

      if (messageImages) {
        messageImages.forEach((photo) =>
          this.uploadService.isFileValid(photo),
        );
        messageImages.forEach((photo) => {
          photo.originalname = Date.now() + photo.originalname.replace(/ /g,'_')
          messageDto.messageImages.push(
            process.env.S3_BUCKET_URL_HOUSEHOLD_STATIC_FILES + req.user.household.id
            + `/${process.env.S3_BUCKET_KEY_MESSAGE_IMAGES}/` + photo.originalname
            )
          this.uploadService.uploadHouseholdMessageImage(
            photo,
            process.env.S3_BUCKET_NAME_HOUSEHOLD_STATIC_FILES,
            req.user.household.id
          )
        })
      }

      // if (messageDocuments && req.user.user.role !== Roles.CHILD) {
        if (messageDocuments) {
          messageDocuments.forEach((doc) => this.uploadService.isDocumentValid(doc))
          for (let doc of messageDocuments) {
            doc.originalname = Date.now() + doc.originalname.replace(/ /g, '_')
            messageDto.messageDocuments.push(
              process.env.S3_BUCKET_URL_HOUSEHOLD_STATIC_FILES + req.user.household.id
              + `/${process.env.S3_BUCKET_KEY_MESSAGE_DOCUMENTS}/` + doc.originalname,
            );
            console.log(process.env.S3_BUCKET_URL_HOUSEHOLD_STATIC_FILES + req.user.household.id
              + `/${process.env.S3_BUCKET_KEY_MESSAGE_DOCUMENTS}/` + doc.originalname)
            await this.uploadService.uploadHouseholdMessageDocument(
              doc,
              process.env.S3_BUCKET_NAME_HOUSEHOLD_STATIC_FILES,
              req.user.household.id
            );
          }
        }

        // } else if (messageDocuments && req.user.user.role === Roles.CHILD) {
        //   messageDocuments.forEach((doc) => this.uploadService.isDocumentValidForChild(doc))
        //   messageDocuments.forEach((doc) => {
        //     doc.originalname = Date.now() + doc.originalname.replace(/ /g, '_')
        //     messageDto.messageDocuments.push(
        //       process.env.S3_BUCKET_URL_HOUSEHOLD_STATIC_FILES + req.user.user.household.id
        //       + `/${process.env.S3_BUCKET_KEY_MESSAGE_DOCUMENTS}/` + doc.originalname,
        //     );
        //     this.uploadService.uploadHouseholdMessageDocument(
        //       doc,
        //       process.env.S3_BUCKET_NAME_HOUSEHOLD_STATIC_FILES,
        //       req.user.user.household.id
        //     );
        //   });
        // }>

      const message = await this.householdService.saveMessage(messageDto)
      await this.householdService.sendMessage(message, req.user)

      this.socketGateway.handleHouseholdMessage(message);
      const notifyUsers = req.user.household.users.filter((user) => user.id !== req.user.id)
      const devices = await this.notificationService.findDeviceTokensForUser(notifyUsers)
      console.log('DEVICES', devices)
      this.notificationService.notifyNewMessage(devices, message, req.user);

      res.status(HttpStatus.OK).json({ message: 'Your message has been delivered successfully!' })
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'Message deleted!' })
  @Get('message/delete')
  @UseGuards(
    AuthGuard('jwt'),
    RolesGuard([
      Roles.TEENAGER,
      Roles.PARENT,
      Roles.SECOND_PARENT,
    ]),
  )
  public async deleteMessage(
    @Req() req, 
    @Res() res,
    @Query('id') messageId: string
    ): Promise<void> {
    try {

      await this.householdService.deleteMessage(messageId, req.user)

      res.status(HttpStatus.OK).json({ message: `Message ${messageId} deleted!`});
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'Video token sent!' })
  @Get('video/token')
  public async getVideoToken(@Req() req, @Res() res): Promise<void> {
    try {

      const data = await this.householdService.generateVideoToken(req.user)

      res.status(HttpStatus.OK).json({...data});
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'Video token sent!' })
  @Get('video/start')
  public async startVideoConference(@Req() req, @Res() res): Promise<void> {
    console.log('exec');

    try {
      const plainUser = {
        id: req.user.id, 
        firstName: req.user.firstName, 
        lastName: req.user.lastName, 
        profileImage: req.user.profileImage
      };
      this.socketGateway.handleInitHouseholdVideoConference(plainUser as User, req.user.household.id)
      const notifyUsers = req.user.household.users.filter((user) => user.id !== req.user.id)
      const devices = await this.notificationService.findDeviceTokensForUser(notifyUsers)
      this.notificationService.notifyIncomingHouseholdCall(devices, req.user);


      res.status(HttpStatus.OK).json({ message: 'OK'});
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'Video token sent!' })
  @Get('video/connect')
  public async connectToVideoConference(@Req() req, @Res() res): Promise<void> {
    try {
      const plainUser = {
        id: req.user.id, 
        firstName: req.user.firstName, 
        lastName: req.user.lastName, 
        profileImage: req.user.profileImage
      };
      this.socketGateway.handleConnectToHouseholdVideoConference(plainUser as User, req.user.household.id)
      res.status(HttpStatus.OK).json({ message: 'OK'});
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'Video token sent!' })
  @Get('video/cancel')
  public async cancelVideoConference(@Req() req, @Res() res): Promise<void> {
    try {
      
      console.log('exec')
      await this.householdService.cancelHouseholdVideoConference(req.user)

      res.status(HttpStatus.OK).json({ message: 'OK'});
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'Video token sent!' })
  @Get('video/end')
  public async endVideoConference(@Req() req, @Res() res): Promise<void> {
    try {
      this.socketGateway.handleEndHouseholdVideoConference(req.user.household.id)

      res.status(HttpStatus.OK).json({ message: 'OK'});
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }

  @Get('voice/token')
  @ApiOkResponse({ description: 'Voice token sent!' })
  public async getVoiceToken(
    @Req() req,
    @Res() res,
  ): Promise<void> {
    try {
      const data = await this.householdService.generateVoiceToken(req.user)
      res
        .set('Access-Control-Allow-Origin', '*')
        .set('Access-Control-Allow-Methods', '*')
        .set('Access-Control-Allow-Headers', 'Content-Type')
        .set('Content-Type', 'application/json')
        .status(HttpStatus.OK)
        .json({ ...data })
    } catch (err) {
      // console.log(err, req.headers)
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message })
    }
  }

  @ApiOkResponse({ description: 'Voice conference started!' })
  @Get('voice/conference/connect')
  public async startVoiceConference(
    @Req() req,
    @Res() res,
  ) {
    try {
      const data = await this.householdService.startVoiceConference(req.user)

      res
        .set('Access-Control-Allow-Origin', '*')
        .set('Content-Type', 'text/xml')
        .status(HttpStatus.OK)
        .json(data.toString())
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message })
    }
  }
  // @Get('voice')
  // @UseGuards(AuthGuard('jwt'), RolesGuard([Roles.CHILD, Roles.TEENAGER, Roles.PARENT, Roles.SECOND_PARENT]))
  // @ApiBearerAuth()
  // public async handleIncomingVoiceCall(@Req() req, @Res() res) {
  //   try {

  //     const data = await this.householdService.handleIncomingVoiceCall(req.user.user)

  //     res.status(HttpStatus.OK).json(data.toString());
  //   } catch (err) {
  //     res
  //     .status(err.status || HttpStatus.CONFLICT)
  //     .json({ message: err.detail || err.message });
  //   }
  // }

  @UseGuards(AuthGuard('jwt'))
  @Get('drop-count')
  public async dropCountFromContactBadge(
    @Res() res,
    @Req() req,
  ): Promise<void> {
    try {
      await this.householdService.dropCountFromContactBadge(req.user)
      res.status(HttpStatus.OK).json({ message: 'OK' })
    } catch (err) {
      console.log(err)
      res
        .status(err.status || HttpStatus.BAD_REQUEST)
        .json({ message: err.message })
    }
  }

  @ApiOkResponse({ description: 'Household returned!' })
  @ApiNotFoundResponse({ description: 'Household does not exist!'})
  @Get()
  public async getHousehold(@Req() req, @Res() res): Promise<void> {
    try {
      let household = await this.householdService.findOne({user: req.user}, {all: true});
      if (!household) {
        throw new NotFoundException('Household does not exist!');
      }
      res.status(HttpStatus.OK).json(household);
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }
}
