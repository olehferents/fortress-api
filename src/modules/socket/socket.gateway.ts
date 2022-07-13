import {
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Socket, Server } from 'socket.io'
import { SubscribeMessage } from '@nestjs/websockets'
import { HouseholdMessageDto } from '../models/household/dto/householdMessage.dto'
import { ContactReq } from '../models/request/entity/request.entity'
import { ContactMessageDto } from '../models/contact/dto/contactMessage.dto'
import { HouseholdMessage } from '../models/household/entity/householdMessage.mongoEntity'
import { ContactMessage } from '../models/contact/entity/contactMessage.mongoEntity'
import { User } from '../models/user/entities/user.entity'
// import { MissedCall } from '../models/missedCall/entity/missedCall.entity'

@WebSocketGateway()
export class SocketGateway implements OnGatewayInit {
  @WebSocketServer() server: Server
  private logger: Logger = new Logger('AppGateway')

  // @SubscribeMessage('msgToHousehold')
  handleHouseholdMessage(
    @MessageBody() message: HouseholdMessage,
    @ConnectedSocket() client?: Socket,
  ): void {
    console.log()
    this.server.emit(`msgToHouseholdClient${message.householdId}`, message)
  }

  // @SubscribeMessage('msgToHousehold')
  handleContactMessage(
    @MessageBody() message: ContactMessage,
    targetId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    console.log(`msgToUser${targetId}`)
    this.server.emit(`msgToUser${targetId}`, message)
  }

  handleInitContactVideoCall(
    user: any,
    targetId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`videoCallToUser${targetId}`, {action: 'initCall', user})
  }

  handleInformOfInterlocutorCamera(
    message: any,
    targetId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`videoCallToUser${targetId}`, {action: 'checkCameraVisibility', message})
  }

  handleConnectToContactVideoCall(
    user: any,
    targetId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`videoCallToUser${targetId}`, {action: 'connectToCall', user})
  }

  handleCancelContactVideoCall(
    message: any,
    targetId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`videoCallToUser${targetId}`, {action: 'cancelCall', message})
  }

  handleDeclineContactVideoCall(
    targetId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`videoCallToUser${targetId}`, {action: 'declineCall'})
  }

  handleDeclineContactVideoCallIfUserBusy(
    targetId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`videoCallToUser${targetId}`, {action: 'contactBusy'})
  }

  handleEndContactVideoCall(
    targetId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`videoCallToUser${targetId}`, {action: 'endCall'})
  }


  

  handleInitHouseholdVideoConference(
    user: User,
    householdId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`videoCallToHousehold${householdId}`, {action: 'initCall', user})
  }

  handleConnectToHouseholdVideoConference(
    user: User,
    householdId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`videoCallToHousehold${householdId}`, {action: 'connectToCall', user})
  }

  handleCancelHouseholdVideoConference(
    message: any,
    householdId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`videoCallToHousehold${householdId}`, {action: 'cancelCall', message})
  }

  handleEndHouseholdVideoConference(
    householdId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`videoCallToHousehold${householdId}`, {action: 'endCall'})
  }

  handleMissedCall(
    @MessageBody() missedCall: any,
    userId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`notifyMissedCall${userId}`, {action: 'cancelCall', missedCall})
  }

  handleAddToContactRequestToUser(
    @MessageBody() request: ContactReq,
    userId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`requestToUser${userId}`, request)
  }

  handleAddToContactRequestToParents(
    @MessageBody() request: ContactReq,
    householdId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    this.server.emit(`requestToParents${householdId}`, request)
  }

  handleRequestToContactApproved(
    @MessageBody() message: any,
    userId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    try {
      this.server.emit(`notifyUser${userId}`, message)
    } catch (err) {
      console.log(err)
    }
  }

  handleRequestToContactApprovedForParents(
    @MessageBody() message: any,
    householdId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    console.log('im in handleRequestToContactApprovedForParents')
    try {
      this.server.emit(`notifyParents${householdId}`, message)
      console.log('im in handleRequestToContactApprovedForParents after server emits')
    } catch (err) {
      console.log(err)
    }
  }

  handleRequestToContactDenied(
    @MessageBody() message: any,
    userId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    try {
      this.server.emit(`notifyUser${userId}`, message)
    } catch (err) {
      console.log(err)
    }
  }

  handleRequestToContactDeniedForParents(
    @MessageBody() message: any,
    householdId: string,
    @ConnectedSocket() client?: Socket,
  ): void {
    try {
      this.server.emit(`notifyParents${householdId}`, message)
    } catch (err) {
      console.log(err)
    }
  }

  afterInit(server: Server) {
    this.logger.log('Init')
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`)
  }
}
