import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Matches } from 'class-validator'
import { SwaggerMessagesEnum } from 'src/constants/messagesEnum/swaggerMessages.enum'
import { Regex } from 'src/constants/regex'

export class DeviceDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MmI3MzI3NS02MjBkLTRlODMtOGE1Ni02N2Q1YzNmYj',
    description: SwaggerMessagesEnum.DESCRIBE_DEVICE_TOKEN,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  token: string

  @ApiProperty({
    example: 'ios | android',
    description: SwaggerMessagesEnum.DESCRIBE_DEVICE_OS,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(Regex.OS)
  os: 'ios' | 'android'
}

const json = {
  collapseKey: 'com.fortress',
  data: {
    android_channel_id: '500',
    body: 'Test27 Star is calling you.',
    clickAction: 'contacts',
    contactName: '',
    id: '',
    sound: 'default',
    tag: 'Fortress notification',
    title: 'Contact Call',
    type: 'incomingCall',
  },
  from: '871694202307',
  messageId: '0:1627914363195327%4d199ceb4d199ceb',
  notification: {
    android: { channelId: '500', sound: 'default' },
    body: 'Test27 Star is calling you.',
    title: 'Contact Call',
  },
  sentTime: 1627914363178,
  ttl: 86400,
}
