import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { SwaggerMessagesEnum } from 'src/constants/messagesEnum/swaggerMessages.enum'

export class AcceptRequestDto {
  @ApiProperty({
    example: '7c7ddee7-440f-44de-8e87-91dea4384ea5',
    description: SwaggerMessagesEnum.DESCRIBE_REQUEST_ID,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  requestId: string

  @ApiProperty({
    example: true,
    description: SwaggerMessagesEnum.DESCRIBE_TEXT,
    required: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  text: any = true

  @ApiProperty({
    example: true,
    description: SwaggerMessagesEnum.DESCRIBE_MEDIA,
    required: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  media: any = true

  @ApiProperty({
    example: true,
    description: SwaggerMessagesEnum.DESCRIBE_VOICECALL,
    required: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  voiceCall: any = true

  @ApiProperty({
    example: true,
    description: SwaggerMessagesEnum.DESCRIBE_VIDEOCALL,
    required: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  videoCall: any = true

  @ApiProperty({
    example: ['7c7ddee7-440f-44de-8e87-91dea4384ea5', '7c7ddee7-440f-44de-8e87-91dea4384ea5'],
    description: SwaggerMessagesEnum.DESCRIBE_CHILDREN_ON_ACCEPT_REQUEST,
    required: false,
    isArray: true,
  })
  @IsOptional()
  children: string[] | string
}
