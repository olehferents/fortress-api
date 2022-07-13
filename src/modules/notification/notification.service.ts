import { forwardRef, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { parentPushSettings, childPushSettings } from "src/configs/push-notification-settings";
import * as admin from 'firebase-admin';
import { DeviceDto } from "./dto/device.dto";
import { User } from "../models/user/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Device } from "./entity/device.entity";
import { Repository } from "typeorm";
import { UserService } from "../models/user/user.service";
import { notificationOptions } from "src/constants/constant";
import { HouseholdMessage } from "../models/household/entity/householdMessage.mongoEntity";
import { ContactMessage } from "../models/contact/entity/contactMessage.mongoEntity";
import { ContactReq } from "../models/request/entity/request.entity";
import { type } from "os";


@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
  ) {}

  async connectDeviceToUserProfile(deviceDto: DeviceDto, user: User): Promise<void> {
    try {
      let device = this.deviceRepository.create(deviceDto);
      device.user = user;
      await this.deviceRepository.save(device);
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  async findDeviceTokensForUser(users: User[]): Promise<Device[]> {
    try {
      let devices = []
      for (let user of users) 
        devices.push(...await this.deviceRepository.find({where: {user}}))
      return devices
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  async sendToDevices(
    devices: Device[], 
    {title, body, clickAction, contactId, contactName, type, isHousehold, id}: any,
    dataOnly = false,
  ): Promise<void> {
    try {
      if (devices?.length > 0) {
        const payload = {
          data: {
            title,
            body,
            tag: 'Fortress notification',
            sound: 'default',
            android_channel_id: '500',
            clickAction,
            priority: type == 'incomingCall' ? 'high' : 'low',
            isHousehold: isHousehold === true ? 'true' : 'false',
            contactId: contactId ? contactId as string : '',
            contactName: contactName ? contactName as string : '',
            type: type ? type as string : '',
          }
        }
        !dataOnly ? 
          (payload['notification'] = {
              title,
              body,
              tag: 'Fortress notification',
              sound: 'default',
              android_channel_id: '500',
          }) : null
        const tokens = devices.map((device) => device.notify ? device.token : null)
        let response = await admin.messaging().sendToDevice(tokens, payload, notificationOptions.high)
        let expiredDevices = []
        console.log(devices)
        response.results.forEach((result, index) => {
          console.log(result)
          const error = result.error;
          if (error) {
            if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
              expiredDevices.push(devices[index])
            }
          }
        })
        expiredDevices?.length > 0 ?
          await this.deviceRepository.delete(expiredDevices) : null
      }
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }
  async notifyIncomingHouseholdCall(devices: Device[], user: User) {
    const data = {
      title: 'Household Call', 
      body: 
        `${user.firstName} ${user.lastName} in household`,
      clickAction: 'twilioCall',
      type: 'incomingCall',
      isHousehold: true
    }
    await this.sendToDevices(devices, data, true)
  }

  async notifyCancelledHouseholdCall(devices: Device[], user: User) {
    const data = {
      title: 'Household Call', 
      body: 
        `${user.firstName} ${user.lastName} in household`,
      clickAction: 'twilioCall',
      type: 'cancelCall',
      isHousehold: true
    }
    await this.sendToDevices(devices, data, true)
  }

  async notifyIncomingContactCall(devices: Device[], user : User, contactId: string) {
    const data = {
      title: 'Contact Call', 
      body: 
        `${user.firstName} ${user.lastName}`,
      clickAction: 'twilioCall',
      type: 'incomingCall',
      isHousehold: false,
      contactId
    }
    await this.sendToDevices(devices, data, true)
  }

  async notifyCancelledContactCall(devices: Device[], user : User, contactId: string) {
    const data = {
      title: 'Contact Call', 
      body: 
        `${user.firstName} ${user.lastName}`,
      clickAction: 'twilioCall',
      type: 'cancelCall',
      isHousehold: false,
      contactId
    }
    await this.sendToDevices(devices, data, true)
  }

  async notifyMissedCall(devices: Device[], message: ContactMessage, user: User) {
    await this.sendToDevices(devices, {title: 'Missed call', body: `Missed call from ${user.firstName} ${user.lastName}`})
  }
  async notifyNewMessage(devices: Device[], message: ContactMessage | HouseholdMessage, user: User): Promise<void> {
    const data = {
      title: message instanceof ContactMessage ? 'New Fortress Message' : 'New Household Message', 
      body: user.firstName + user.lastName + ': ' + message.body,
      clickAction: message instanceof ContactMessage ? 'chat' : 'household',
      contactId: message instanceof ContactMessage ? message.contactId : null,
      contactName: message instanceof ContactMessage ? `${user.firstName} ${user.lastName}` : null
    }
    if (!message?.body && (message?.messageImages || message?.messageDocuments)) {
      console.log(message?.messageImages?.length, message?.messageDocuments?.length)
      data.body = message.messageImages && message.messageDocuments ? 
        user.firstName + user.lastName + ': ' + `Sent ${+message?.messageImages?.length + +message?.messageDocuments?.length} file(s)`:
        message.messageImages ? 
          user.firstName + user.lastName + ': ' + `Sent ${+message?.messageImages?.length} image(s)`:
          user.firstName + user.lastName + ': ' + `Sent ${+message?.messageDocuments?.length} file(s)`

    }
    if (!message?.body && message.messageVoice) {
      data.body =  user.firstName + user.lastName + ': ' + 'Voice message'
    }
    console.log(data.body)
    await this.sendToDevices(devices, data)
  }
  async notifyNewChildMessage(devices: Device[], message: ContactMessage, user: User): Promise<void> {
    const data = {
      title: 'New message to child', 
      body: user.firstName + ': ' + message.body,
      clickAction: 'chat',
      contactId: message.contactId,
      firstName: user.firstName,
      lastName: user.lastName
    }
    await this.sendToDevices(devices, data)
  }
  // async notifyNewOffers() {}
  async notifyRequest(devices: Device[], request: ContactReq, isTargetChild: boolean = true) {
    const data = {
      title: 'Contact Request', 
      body: 
        `${request.sender.firstName} ${request.sender.lastName} wants to add you to their contact list! ${isTargetChild ? 'Ask your parents for approval.' : ''}`,
      clickAction: 'contacts'
    }
    await this.sendToDevices(devices, data)
  }

  async notifyRequestApprove(devices: Device[], target: User, isTargetChild = true) {
    const data = {
      title: 'Contact Approve',
      body: isTargetChild ? 
        `Parents of ${target.firstName} ${target.lastName} successfully approved your contact request!` :
        `${target.firstName} ${target.lastName} successfully approved your contact request!`,
      clickAction: 'contacts'
    }
    await this.sendToDevices(devices, data)
  }
  async notifyRequestApproveForChild(devices: Device[], user: User, isTarget = true, ) {
    const data = {
      title: 'Contact Approve', 
      body: isTarget ? 
        `Your contact with ${user.firstName} ${user.lastName} was successfully approved by your parents!` :
        ``,
      clickAction: 'contacts'
    }
    await this.sendToDevices(devices, data)
  }
  async notifyRequestDeny(devices: Device[], target: User, isTargetChild = true) {
    const data = {
      title: 'Contact Deny', 
      body: isTargetChild ? 
        `Parents of ${target.firstName} ${target.lastName} denied your contact request!` :
        `${target.firstName} ${target.lastName} denied your contact request!`,
      clickAction: 'contacts'
    }
    await this.sendToDevices(devices, data)
  }

  async notifyRequestDenyForChild(devices: Device[], user: User, isTarget = true) {
    const data = {
      title: 'Contact Approve', 
      body: isTarget ? 
        `Your contact with ${user.firstName} ${user.lastName} was denied by your parents!` :
        ``,
      clickAction: 'contacts'
    }
    await this.sendToDevices(devices, data)
  }


  async notifyRequestForParents(devices: Device[], request: ContactReq, isSentByChild: boolean = true) {
    const data = {
      title: 'Child contact request', 
      body: isSentByChild ?
        `Your child ${request.sender.firstName} ${request.sender.lastName} requests to add new Fortress contact ${request.target.firstName} ${request.target.lastName}!` : 
        `${request.sender.firstName} ${request.sender.lastName} wants to get in contact with  your child ${request.target.firstName} ${request.target.lastName}!`
      ,
      clickAction: 'contacts'
    }
    await this.sendToDevices(devices, data)
  }
  async notifyRequestApproveForParents(devices: Device[], target: User, sender: User) {
    const data = {
      title: 'Child contact approve', 
      body: `${target.firstName} ${target.lastName} and ${sender.firstName} ${sender.lastName} are now connected!`,
      clickAction: 'contacts'
    }
    await this.sendToDevices(devices, data)
  }
  async notifyRequestDenyForParents(devices: Device[], request: ContactReq, user: User) {
    const data = {
      title: 'Child contact deny', 
      body: `Request from ${request.sender.firstName} ${request.sender.lastName} was denied!`,
      clickAction: 'contacts'
    } 
    await this.sendToDevices(devices, data)
  }

  async notifyNewHouseholdMember(devices: Device[], user: User) {
    const data = {
      title: 'Household account activated', 
      body: `${user.firstName} ${user.lastName} is now in your household and will be part of your household chat.`,
      clickAction: 'household'
    }
    await this.sendToDevices(devices, data)
  }
}