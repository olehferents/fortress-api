import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEmail, Matches, IsString, MaxLength } from "class-validator";
import { ValidationMessagesEnum } from "src/constants/messagesEnum";
import { SwaggerMessagesEnum } from "src/constants/messagesEnum/swaggerMessages.enum";
import { Regex } from "src/constants/regex";

export class UserDto {
  @ApiProperty({
    example: 'mymail@gmail.com',
    description: SwaggerMessagesEnum.DESCRIBE_EMAIL,
    required: true
  })
  @IsNotEmpty()
  @IsEmail()
  @Matches(Regex.EMAIL, {
    message: ValidationMessagesEnum.EMAIL,
  })
  email: string;

  @ApiProperty({
    example: 'Qwerty1234',
    description: SwaggerMessagesEnum.DESCRIBE_PASSWORD,
    required: true
  })
  @IsNotEmpty()
  @IsString()
  @Matches(Regex.PASSWORD, {
    message: ValidationMessagesEnum.PASSWORD,
  })
  password: string;


  @ApiProperty({
    example: '+380665551799',
    description: SwaggerMessagesEnum.DESCRIBE_PHONE_NUMBER,
    required: true
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(15)
  phoneNumber: string;
}