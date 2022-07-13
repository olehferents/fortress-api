import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsNotEmpty, IsString, MaxLength, IsArray} from 'class-validator'
import { ValidationMessagesEnum } from 'src/constants/messagesEnum'
import { SwaggerMessagesEnum } from 'src/constants/messagesEnum/swaggerMessages.enum'

export class ContactMessageDto {
  @ApiProperty({
    example: '1cbacfda-5509-4429-aa77-e67647bb2d6e',
    description: SwaggerMessagesEnum.DESCRIBE_CONTACT_ID,
    required: true,
  })
  @IsNotEmpty()
  @IsString({ message: ValidationMessagesEnum.CONTACT_ID })
  @MaxLength(36, { message: ValidationMessagesEnum.CONTACT_ID })
  contactId: string

  @ApiProperty({
    example: '1cbacfda-5509-4429-aa77-e67647bb2d6e',
    description: SwaggerMessagesEnum.DESCRIBE_CONTACT_ID,
    required: true,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString({ message: ValidationMessagesEnum.CONTACT_ID })
  @MaxLength(36, { message: ValidationMessagesEnum.CONTACT_ID })
  temporaryId: string

  @IsOptional()
  @IsString({ message: ValidationMessagesEnum.USER_ID })
  @MaxLength(36, { message: ValidationMessagesEnum.USER_ID })
  userId: string

  @ApiProperty({
    example: 'Your message text here!',
    description: SwaggerMessagesEnum.DESCRIBE_MESSAGE_BODY,
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString({ message: ValidationMessagesEnum.MESSAGE_BODY })
  body: string

  @ApiProperty({
    example: 'Array of 10 images max',
    description: SwaggerMessagesEnum.DESCRIBE_MESSAGE_IMAGES,
    required: false,
    isArray: true,
  })
  @IsOptional()
  messageImages?: any[]

  @ApiProperty({
    example: 'Your voice message',
    description: SwaggerMessagesEnum.DESCRIBE_MESSAGE_VOICE,
    required: false,
    isArray: true,
  })
  @IsOptional()
  messageVoice: any

  @ApiProperty({
    example: 'Array of 10 images max',
    description: SwaggerMessagesEnum.DESCRIBE_MESSAGE_DOCUMENTS,
    required: false,
    isArray: true,
  })
  @IsOptional()
  messageDocuments: any[]

  @ApiProperty({
    example: 'Array of 10 videos max',
    description: SwaggerMessagesEnum.DESCRIBE_MESSAGE_DOCUMENTS,
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  messageVideos: any[]
}
