import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsArray, IsEmail, isEmail, IsNotEmpty, IsObject, IsString, MaxLength, ValidateNested } from "class-validator"
import { SwaggerMessagesEnum } from "src/constants/messagesEnum/swaggerMessages.enum"
import { InviteDto } from "./invite.dto"

export class InviteMultipleDto {
  @ApiProperty({
    example: InviteDto.prototype,
    description: SwaggerMessagesEnum.DESCRIBE_INVITES_ARRAY,
    required: true
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({each: true})
  @Type(() => InviteDto)
  invites: InviteDto[]
}