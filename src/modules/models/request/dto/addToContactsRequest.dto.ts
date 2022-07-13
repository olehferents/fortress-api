import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { ValidationMessagesEnum } from "src/constants/messagesEnum";
import { SwaggerMessagesEnum } from "src/constants/messagesEnum/swaggerMessages.enum";

export class AddToContactsRequestDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  senderId: string

  @ApiProperty({
    example: '7c7ddee7-440f-44de-8e87-91dea4384ea5',
    description: SwaggerMessagesEnum.DESCRIBE_TARGET_ID,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  targetId: string

  @ApiProperty({
    example: 'Hello villager, add me please to your contact list))',
    description: SwaggerMessagesEnum.DESCRIBE_REQUEST_MESSAGE,
    required: false,
  })
  @IsOptional()
  @IsString()
  message: string = null
}