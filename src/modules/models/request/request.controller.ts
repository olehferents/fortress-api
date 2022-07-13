import { Controller, Get, UseGuards, Req, Res, NotFoundException, HttpStatus, Post, UseInterceptors, Body, UploadedFiles, NotAcceptableException, ConflictException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse, ApiConsumes, ApiForbiddenResponse, ApiConflictResponse, ApiNotFoundResponse } from "@nestjs/swagger";
import { multerOptions } from "src/constants/constant";
import { Roles } from "src/constants/roles.enum";
import { RolesGuard } from "src/helpers/guards/roles.guard";
import { FileUploadService } from "../../file-upload/file-upload.service";
import { HouseholdMessageDto } from "../household/dto/householdMessage.dto";
import { HouseholdService } from "../household/household.service";
import { AcceptRequestDto } from "./dto/acceptRequest.dto";
import { AddToContactsRequestDto } from "./dto/addToContactsRequest.dto";
import { DenyRequestDto } from "./dto/denyRequest.dto";
import { RequestService } from "./request.service";

@ApiTags('Request')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Provide valid access token!' })
@ApiForbiddenResponse({ description: 'Not enough permissions to perform this action!' })
@ApiConsumes('multipart/form-data')
@Controller('request')
@UseGuards(AuthGuard('jwt'))
export class RequestController {
  constructor(private readonly requestService: RequestService) {}
  
  @ApiConflictResponse({ 
    description: 'SenderId and TargetId cannot be the same |' + 
                 'You cannot send request to your household member |' + 
                 'You cannot send request to your contact! |' +
                 'You have already sent request to this user!'
  })
  @ApiNotFoundResponse({
    description: 'Request with this id was not found |' + 
                 'Household with this id was not found |' + 
                 'User with this id was not found |'
  })
  @Post()
  public async sendRequest(
      @Body() addToContactsRequest: AddToContactsRequestDto,
      @Res() res,
      @Req() req
  ): Promise<void> {
      try {
        addToContactsRequest.senderId = req.user.id;

        if (addToContactsRequest.senderId === addToContactsRequest.targetId) {
          throw new ConflictException('SenderId and TargetId cannot be the same')
        }

        await this.requestService.initSendRequest(req.user, addToContactsRequest)

        res
          .status(HttpStatus.OK)
          .json({message: 'Request successfully sent!'})
      } catch (err) {
          res.status(err?.status || HttpStatus.BAD_REQUEST).json({message: err?.detail || err?.message})
      }
  } 

  @ApiNotFoundResponse({
    description: 'Request with this id was not found |' + 
                 'Household with this id was not found |' + 
                 'User with this id was not found |'
  })
  @UseGuards(RolesGuard([Roles.PARENT, Roles.SECOND_PARENT, Roles.OTHER, Roles.TEENAGER]))
  @Post('accept')
  public async acceptRequest(
      @Body() acceptRequest: AcceptRequestDto,
      @Res() res,
      @Req() req,
  ): Promise<void> {
      try {
        await this.requestService.initAcceptRequest(acceptRequest, req.user)

        res
          .status(HttpStatus.OK)
          .json({message: 'OK'})
      } catch (err) {
          res.status(err.status || HttpStatus.BAD_REQUEST).json({message: err.message})
      }
  }

  @ApiNotFoundResponse({
    description: 'Request with this id was not found |' + 
                 'User with this id was not found |'
  })
  @UseGuards(RolesGuard([Roles.PARENT, Roles.SECOND_PARENT, Roles.OTHER, Roles.TEENAGER]))
  @Post('deny')
  public async denyRequest(
      @Body() denyRequest: DenyRequestDto,
      @Res() res,
      @Req() req,
  ): Promise<void> {
      try {
        await this.requestService.initDenyRequest(req.user, denyRequest)

        res
          .status(HttpStatus.OK)
          .json({message: 'OK'})
      } catch (err) {
          res.status(err.status || HttpStatus.BAD_REQUEST).json({message: err.message})
      }
  }
}
