import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { SwaggerMessagesEnum } from 'src/constants/messagesEnum/swaggerMessages.enum'

export class DenyRequestDto {
  @ApiProperty({
    example: '7c7ddee7-440f-44de-8e87-91dea4384ea5',
    description: SwaggerMessagesEnum.DESCRIBE_REQUEST_ID,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  requestId: string
}
