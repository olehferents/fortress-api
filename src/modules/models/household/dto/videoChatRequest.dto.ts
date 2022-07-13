import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { ValidationMessagesEnum } from "src/constants/messagesEnum";
import { SwaggerMessagesEnum } from "src/constants/messagesEnum/swaggerMessages.enum";

export class VideoChatRequestDto {
  @ApiProperty({
    example: '1cbacfda-5509-4429-aa77-e67647bb2d6e',
    description: SwaggerMessagesEnum.DESCRIBE_HOUSEHOLD_ID,
    required: false,
  })
  @IsNotEmpty()
  @IsString({ message: ValidationMessagesEnum.HOUSEHOLD_ID })
  @MaxLength(37, { message: ValidationMessagesEnum.HOUSEHOLD_ID })
  room: string;

  @ApiProperty({
    example: '1cbacfda-5509-4429-aa77-e67647bb2d6e',
    description: SwaggerMessagesEnum.DESCRIBE_USER_ID,
    required: false,
  })
  @IsNotEmpty()
  @IsString({ message: ValidationMessagesEnum.USER_ID })
  @MaxLength(35, { message: ValidationMessagesEnum.USER_ID })
  identity: string;
}