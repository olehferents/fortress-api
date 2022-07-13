import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  NotFoundException,
  HttpStatus,
  Post,
  UseInterceptors,
  Body,
  UploadedFiles,
  ForbiddenException,
  Query,
  Put,
  BadRequestException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiQuery,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { ValidateNested } from 'class-validator'
import { multerOptions } from 'src/constants/constant'
import { Roles } from 'src/constants/roles.enum'
import { RolesGuard } from 'src/helpers/guards/roles.guard'
import { FileUploadService } from 'src/modules/file-upload/file-upload.service'
import { HouseholdMessageDto } from 'src/modules/models/household/dto/householdMessage.dto'
import { NotificationService } from 'src/modules/notification/notification.service'
import { SocketGateway } from 'src/modules/socket/socket.gateway'
import { Repository } from 'typeorm'
import { User } from '../user/entities/user.entity'
import { UserService } from '../user/user.service'
import { ContactService } from './contact.service'
import { ChildPermissionsDto } from './dto/childPermissions.dto'
import { ContactMessageDto } from './dto/contactMessage.dto'
import { EditContactForChildrenDto } from './dto/editContactForChildren.dto'
import { Contact } from './entity/contact.entity'
import { IsCameraOnDto } from './dto/isCameraOn.dto';

@ApiTags('Contact')
@ApiBearerAuth()
@ApiUnauthorizedResponse({description: 'Provide valid access token!'})
@ApiForbiddenResponse({ description: 'Not enough permissions to perform this action!'})
@Controller('contact')
@UseGuards(AuthGuard('jwt'))
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly uploadService: FileUploadService,
    private readonly socketGateway: SocketGateway,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
  ) {}

  // @Get()
  // @UseGuards(AuthGuard('jwt'), RolesGuard([Roles.CHILD, Roles.TEENAGER, Roles.PARENT, Roles.SECOND_PARENT]))
  // @ApiBearerAuth()
  // @ApiOkResponse({ description: 'Successfully signed in' })
  // @ApiUnauthorizedResponse({ description: 'Provide valid access token' })
  // public async getContacts(@Req() req, @Res() res): Promise<void> {
  //   try {
  //     let contacts = await this.contactService.findAllContactsByUser(req.user.user);
  //     household.users = household.users.filter(user => user.id !== req.user.user.id)
  //     household['messages'] = await this.householdService.findMessagesOfHousehold(req.user.user.household.id)

  //     if (!household) {
  //       throw new NotFoundException('Household does not exist!');
  //     }
  //     res.status(HttpStatus.OK).json(household);
  //   } catch (err) {
  //     res
  //     .status(err.status || HttpStatus.CONFLICT)
  //     .json({ message: err.detail || err.message });
  //   }
  // }

  @Post('message/send')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'messageImages', maxCount: 10 },
        { name: 'messageVoice', maxCount: 1 },
        { name: 'messageDocuments', maxCount: 10 },
      ],
    multerOptions))
  @ApiOkResponse({ description: 'Message sent successfully!' })
  @ApiBadRequestResponse({ 
    description: 'Message OR messageVoice OR messageImages OR messageDocuments are required! |' +
                 'Forbidden to send both message and messageVoice!'
  })
  public async sendMessage(
    @Req() req,
    @Res() res,
    @Body() messageDto: ContactMessageDto,
    @UploadedFiles()
    { messageImages = null, messageVoice = null, messageDocuments = null }: any,
  ): Promise<void> {
    console.log(req);
    console.log(res)
    try {
      console.log(messageDto)
      const contactId = req.user?.contacts?.findIndex(
        (contact) => contact.id === messageDto.contactId,
      )
      const targetId = req.user?.contacts[contactId].users?.filter(
        (usr) => usr.id !== req.user.id,
      )[0].id
      // if (contactId !== -1) {
      //   if (req.user.contacts[contactId].text !== true && messageDto.body) {
      //     throw new ForbiddenException(
      //       'Not enough permissions to send text messages',
      //     )
      //   }
      //   if (
      //     req.user.contacts[contactId].media !== true &&
      //     (messageImages || messageDocuments || messageVoice)
      //   ) {
      //     throw new ForbiddenException(
      //       'Not enough permissions to send media files',
      //     )
      //   }
      // }
      if (
        !messageDto.body &&
        !messageVoice?.length &&
        !messageImages?.length &&
        !messageDocuments?.length
      ) throw new BadRequestException('Message OR messageVoice OR messageImages OR messageDocuments are required')


      if (messageDto.body && messageVoice?.length) 
        throw new BadRequestException('Forbidden to send both message and messageVoice')

      messageDto.userId = req.user.id
      messageImages ? (messageDto.messageImages = []) : null
      messageDocuments ? (messageDto.messageDocuments = []) : null

      if (messageVoice) {
        this.uploadService.isAudioValid(messageVoice[0])
        messageVoice[0].originalname = (
          Date.now() + messageVoice[0].originalname
        ).replace(/ /g, '_')
        messageDto.messageVoice =
          process.env.S3_BUCKET_URL_CONTACT_STATIC_FILES +
          req.user.contacts[contactId].id +
          `/${process.env.S3_BUCKET_KEY_VOICE_MESSAGES}/` +
          messageVoice[0].originalname
        this.uploadService.uploadContactVoiceMessage(
          messageVoice[0],
          process.env.S3_BUCKET_NAME_CONTACT_STATIC_FILES,
          req.user.contacts[contactId].id,
        )
      }

      if (messageImages) {
        messageImages.forEach((photo) =>
          this.uploadService.isDocumentValid(photo),
        )
        messageImages.forEach((photo) => {
          photo.originalname =
            Date.now() + photo.originalname.replace(/ /g, '_')
          messageDto.messageImages.push(
            process.env.S3_BUCKET_URL_CONTACT_STATIC_FILES +
              req.user.contacts[contactId].id +
              `/${process.env.S3_BUCKET_KEY_MESSAGE_IMAGES}/` +
              photo.originalname,
          )
          this.uploadService.uploadContactMessageImage(
            photo,
            process.env.S3_BUCKET_NAME_CONTACT_STATIC_FILES,
            req.user.contacts[contactId].id,
          )
        })
      }

      // if (messageDocuments && req.user.user.role !== Roles.CHILD) {
      if (messageDocuments) {
        messageDocuments.forEach((doc) =>
          this.uploadService.isDocumentValid(doc),
        )
        messageDocuments.forEach((doc) => {
          doc.originalname = Date.now() + doc.originalname.replace(/ /g, '_')
          messageDto.messageDocuments.push(
            process.env.S3_BUCKET_URL_CONTACT_STATIC_FILES +
              messageDto.contactId +
              `/${process.env.S3_BUCKET_KEY_MESSAGE_DOCUMENTS}/` +
              doc.originalname,
          )
          this.uploadService.uploadContactMessageDocument(
            doc,
            process.env.S3_BUCKET_NAME_CONTACT_STATIC_FILES,
            messageDto.contactId,
          )
        })
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
      // }

      const message = await this.contactService.saveMessage(messageDto)
      await this.contactService.sendMessage(message, req.user.contacts[contactId], req.user)


      for (let user of req.user.contacts[contactId].users) {
        if (req.user.id !== user.id && user.role === Roles.CHILD) {
          this.socketGateway.handleContactMessage(message, user.id)
          const child = await this.userService.findByUniqueFieldWithRelations({id:user.id}, ['household', 'household.users'])
          let users = []
          child.household?.users?.forEach(member => 
            [Roles.PARENT as string, Roles.SECOND_PARENT as string].includes(member.role) ? 
              users.push(member) : 
              null
          )
          let devices = await this.notificationService.findDeviceTokensForUser(users)
          await this.notificationService.notifyNewChildMessage(devices, message, req.user)
          devices = await this.notificationService.findDeviceTokensForUser([child])
          await this.notificationService.notifyNewMessage(devices, message, req.user)
        } else {
          this.socketGateway.handleContactMessage(message, user.id)
          let devices = await this.notificationService.findDeviceTokensForUser([user])
          await this.notificationService.notifyNewMessage(devices, message, req.user)
        }
      }
      
      res
        .status(HttpStatus.OK)
        .json({ message: 'Your message has been delivered successfully!' })
    } catch (err) {
      console.error(err)
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message })
    }
  }


  @ApiOkResponse({ description: 'Message deleted!' })
  @ApiBadRequestResponse({ description: 'Message ID was not provided'})
  @ApiQuery({name: 'id', type: 'string', description: 'ID of message to be deleted'})
  @Get('message/delete')
  @UseGuards(
    AuthGuard('jwt'),
    RolesGuard([
      Roles.PARENT,
      Roles.SECOND_PARENT,
      Roles.OTHER,
      Roles.TEENAGER,
    ]),
  )
  public async deleteMessage(
    @Req() req,
    @Res() res,
    @Query('id') messageId: string,
  ): Promise<void> {
    try {
      if (!messageId)
        throw new BadRequestException('Message ID was not provided')
      await this.contactService.deleteMessage(messageId, req.user)
      res
        .status(HttpStatus.OK)
        .json({ message: `Message ${messageId} deleted!` })
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message })
    }
  }

  @ApiOkResponse({ description: 'Video token sent!' })
  @ApiBadRequestResponse({ description: 'ContactID was not provided'})
  @Get('video/token')
  public async getVideoToken(
    @Req() req,
    @Res() res,
    @Query('id') contactId: string,
  ): Promise<void> {
    try {
      if (!contactId)
        throw new BadRequestException('ContactID was not provided')
      const data = await this.contactService.generateVideoToken(req.user, contactId)
      res.status(HttpStatus.OK).json({ ...data })
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message })
    }
  }

  @ApiOkResponse({ description: 'Video token sent!' })
  @Get('video/start')
  public async startVideoCall(
    @Req() req, 
    @Res() res,
    @Query('id') contactId: string,
    ): Promise<void> {
    try {
      const plainUser = {
        contactId,
        id: req.user.id, 
        firstName: req.user.firstName, 
        lastName: req.user.lastName, 
        profileImage: req.user.profileImage
      };
      console.log(req.user.contacts)
      req.user.contacts.forEach(contact => {
        if (contact.id === contactId) {
          contact.users.forEach(async contactUser => {
            if (contactUser.id !== req.user.id) {
              this.socketGateway.handleInitContactVideoCall(plainUser, contactUser.id)
              const devices = await this.notificationService.findDeviceTokensForUser([contactUser])
              this.notificationService.notifyIncomingContactCall(devices, req.user, contactId);
            }
          })
        }          
      })

      res.status(HttpStatus.OK).json({ message: 'OK'});
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'inform about turning off/on camera of interlocutor'})
  @Post("video/switch-camera")
  public async informOfInterlocutorCamera(
    @Res() req,
    @Res() res,
    @Query('id') contactId: string,
    @Body() {isCameraOn}: IsCameraOnDto
  ): Promise<void> {
    try{
      await this.contactService.informOfInterlocutorCamera( req.user, contactId, isCameraOn)
    } catch (err){
      console.log("ERROORRR!")
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });

    }
  }

  @ApiOkResponse({ description: 'Video token sent!' })
  @Get('video/connect')
  public async connectToVideoCall(
    @Req() req, 
    @Res() res,
    @Query('id') contactId: string,
    ): Promise<void> {
    try {
      const plainUser = {
        contactId,
        id: req.user.id, 
        firstName: req.user.firstName, 
        lastName: req.user.lastName, 
        profileImage: req.user.profileImage
      };
      req.user.contacts.forEach(contact => {
        if (contact.id === contactId) {
          contact.users.forEach(contactUser => {
            if (contactUser.id !== req.user.id) {
              this.socketGateway.handleConnectToContactVideoCall(plainUser, contactUser.id)
            }
          })
        }          
      })

      res.status(HttpStatus.OK).json({ message: 'OK'});
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'Video token sent!' })
  @Get('video/cancel')
  public async cancelVideoCall(
    @Req() req, 
    @Res() res,
    @Query('id') contactId: string,
    ): Promise<void> {
    try {

      await this.contactService.cancelVideoCall(req.user, contactId);
      

      res.status(HttpStatus.OK).json({ message: 'OK'});
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'Video token sent!' })
  @Get('video/end')
  public async endVideoCall(
    @Req() req, 
    @Res() res,
    @Query('id') contactId: string,
  ): Promise<void> {
    try {
        req.user.contacts.forEach(contact => {
          if (contact.id === contactId) {
            contact.users.forEach(contactUser => {
              if (contactUser.id !== req.user.id) {
                this.socketGateway.handleEndContactVideoCall(contactUser.id)
              }
            })
          }          
        })
      res.status(HttpStatus.OK).json({ message: 'OK'});
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'Video token sent!' })
  @Get('video/decline')
  public async declineVideoCall(
    @Req() req, 
    @Res() res,
    @Query('id') contactId: string,
  ): Promise<void> {
    try {
      req.user.contacts.forEach(contact => {
        if (contact.id === contactId) {
          contact.users.forEach(contactUser => {
            if (contactUser.id !== req.user.id) {
              this.socketGateway.handleDeclineContactVideoCall(contactUser.id)
            }
          })
        }          
      })
      res.status(HttpStatus.OK).json({ message: 'OK'});
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }

  @ApiOkResponse({ description: 'Video token sent!' })
  @Get('video/decline/busy')
  public async declineVideoCallIfUserBusy(
    @Req() req, 
    @Res() res,
    @Query('id') contactId: string,
  ): Promise<void> {
    try {
      req.user.contacts.forEach(contact => {
        if (contact.id === contactId) {
          contact.users.forEach(contactUser => {
            if (contactUser.id !== req.user.id) {
              this.socketGateway.handleDeclineContactVideoCallIfUserBusy(contactUser.id)
            }
          })
        }          
      })
      res.status(HttpStatus.OK).json({ message: 'OK'});
    } catch (err) {
      res
      .status(err.status || HttpStatus.CONFLICT)
      .json({ message: err.detail || err.message });
    }
  }


  @ApiOkResponse({ description: 'Voice token sent!'})
  @ApiBadRequestResponse({ description: 'ContactID was not provided'})
  @Get('voice/token')
  @UseGuards(
    AuthGuard('jwt'),
    RolesGuard([
      Roles.CHILD,
      Roles.TEENAGER,
      Roles.PARENT,
      Roles.SECOND_PARENT,
    ]),
  )
  public async getVoiceToken(
    @Req() req,
    @Res() res,
    @Query('id') contactId: string,
  ): Promise<void> {
    try {
      if (!contactId)
        throw new BadRequestException('ContactID was not provided')
      const data = await this.contactService.generateVoiceToken(req.user, contactId)
      res
        .set('Content-Type', 'application/json')
        .status(HttpStatus.OK)
        .json({ ...data })
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message })
    }
  }

  @ApiOkResponse({ description: 'Voice call started!'})
  @ApiBadRequestResponse({ description: 'ContactID was not provided'})
  @ApiQuery({ name: 'id', type: 'string', description: 'ContactId', required: true })
  @Get('voice/call/connect')
  @UseGuards(
    AuthGuard('jwt'),
    RolesGuard([
      Roles.CHILD,
      Roles.TEENAGER,
      Roles.PARENT,
      Roles.SECOND_PARENT,
    ]),
  )
  public async startVoiceCall(
    @Req() req,
    @Res() res,
    @Query('id') contactId: string,
  ) {
    try {
      if (!contactId)
        throw new BadRequestException('ContactID was not provided')

      const data = await this.contactService.startVoiceCall(req.user, contactId)

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
  // @UseGuards(
  //   AuthGuard('jwt'),
  //   RolesGuard([
  //     Roles.CHILD,
  //     Roles.TEENAGER,
  //     Roles.PARENT,
  //     Roles.SECOND_PARENT,
  //   ]),
  // )
  // @ApiBearerAuth()
  // public async handleIncomingVoiceCall(
  //   @Req() req,
  //   @Res() res,
  //   @Query('id') contactId: string,
  // ) {
  //   try {
  //     const data = await this.contactService.handleIncomingVoiceCall(
  //       req.user,
  //       contactId,
  //     )
  //     res.status(HttpStatus.OK).json(data.toString())
  //   } catch (err) {
  //     res
  //       .status(err.status || HttpStatus.CONFLICT)
  //       .json({ message: err.detail || err.message })
  //   }
  // }

  @ApiOkResponse({ description: 'Contact deleted successfully!'})
  @ApiNotFoundResponse({description: 'Contact with this id not found!'})
  @ApiQuery({name: 'contactId', type: 'string', description: 'ID of contact between users', required: true})
  @ApiQuery({name: 'childId', type: 'string', description: 'ID of child whose contact you want to delete', required: false})
  @UseGuards(
    AuthGuard('jwt'),
    RolesGuard([
      Roles.PARENT,
      Roles.SECOND_PARENT,
      Roles.OTHER,
      Roles.TEENAGER,
    ]),
  )
  @Get('delete')
  public async deleteContact(
    @Res() res,
    @Req() req,
    @Query('contactId') contactId: string,
    @Query('childId') childId?: string,
  ): Promise<void> {
    try {
      await this.contactService.initDeleteContact(req.user, contactId, childId)

      res.status(HttpStatus.OK).json({ message: 'OK' })
    } catch (err) {
      res
        .status(err.status || HttpStatus.BAD_REQUEST)
        .json({ message: err.message })
    }
  }

  @ApiOkResponse({ description: 'Contact edited successfully!'})
  @ApiNotFoundResponse({
    description: 'Contact with this id not found! |' +
                 'Cannot find user of contact with id! |' +
                 'Child not found! |'
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard([Roles.PARENT, Roles.SECOND_PARENT]))
  @Put('edit')
  public async editContactForChildren(
    @Res() res,
    @Req() req,
    @Body() editContactDto: EditContactForChildrenDto,
  ): Promise<void> {
    try {
      await this.contactService.editContactForChildren(req.user, editContactDto)

      res.status(HttpStatus.OK).json({ message: 'OK' })
    } catch (err) {
      console.log(err)
      res
        .status(err.status || HttpStatus.BAD_REQUEST)
        .json({ message: err.message })
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('drop-count')
  public async dropCountFromContactBadge(
    @Query('contactId') contactId: string,
    @Res() res,
    @Req() req,
  ): Promise<void> {
    try {
      await this.contactService.dropCountFromContactBadge(req.user, contactId)
      res.status(HttpStatus.OK).json({ message: 'OK' })
    } catch (err) {
      console.log(err)
      res
        .status(err.status || HttpStatus.BAD_REQUEST)
        .json({ message: err.message })
    }
  }
}
