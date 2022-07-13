import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEmail, Matches, IsString, MaxLength, IsOptional } from "class-validator";
import { ValidationMessagesEnum } from "src/constants/messagesEnum";
import { SwaggerMessagesEnum } from "src/constants/messagesEnum/swaggerMessages.enum";
import { Regex } from "src/constants/regex";

export class CredentialsDto {
  @ApiProperty({
    example: 'mymail@gmail.com',
    description: SwaggerMessagesEnum.DESCRIBE_EMAIL,
    required: true
  })
  @IsOptional()
  @IsString()
  login: string;

  @ApiProperty({
    example: '+380665551799',
    description: SwaggerMessagesEnum.DESCRIBE_PHONE_NUMBER,
    required: true
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  @Matches(Regex.PHONE, {
    message: ValidationMessagesEnum.PHONE,
  })
  phoneNumber: string;
}