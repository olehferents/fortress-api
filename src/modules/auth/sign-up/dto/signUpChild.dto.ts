import { IsString, MaxLength, IsEmail, Matches, IsNotEmpty, IsOptional, IsNumber } from "class-validator";
import { ValidationMessagesEnum } from "src/constants/messagesEnum";
import { MatchTwoFields } from "src/helpers/validators/matchTwoField.decorator";
import { Regex } from "src/constants/regex";
import { ApiProperty } from "@nestjs/swagger";
import { SwaggerMessagesEnum } from "src/constants/messagesEnum/swaggerMessages.enum";

export class SignUpChildDto {
  @ApiProperty({
    example: 'Pavlov',
    description: SwaggerMessagesEnum.DESCRIBE_FIRST_NAME,
    required: true
  })
  @IsNotEmpty()
  @IsString({ message: ValidationMessagesEnum.FIRST_NAME })
  @MaxLength(40, { message: ValidationMessagesEnum.FIRST_NAME })
  firstName: string;

  @ApiProperty({
    example: 'Boychuk',
    description: SwaggerMessagesEnum.DESCRIBE_LAST_NAME,
    required: true
  })
  @IsNotEmpty()
  @IsString({ message: ValidationMessagesEnum.LAST_NAME })
  @MaxLength(40, { message: ValidationMessagesEnum.LAST_NAME })
  lastName: string;

  @ApiProperty({
    example: 'Daphne',
    description: SwaggerMessagesEnum.DESCRIBE_USERNAME,
    required: true
  })
  @IsNotEmpty()
  @IsString({ message: ValidationMessagesEnum.FIRST_NAME })
  @MaxLength(40, { message: ValidationMessagesEnum.FIRST_NAME })
  username: string;

  
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
    example: 'Qwerty1234',
    description: SwaggerMessagesEnum.DESCRIBE_CONFIRM_PASSWORD,
    required: true
  })
  @IsNotEmpty()
  @IsString()
  @MatchTwoFields('password')
  confirmPassword: string;
  
  @ApiProperty({
    example: '+380665551799',
    description: SwaggerMessagesEnum.DESCRIBE_PHONE_NUMBER,
    required: true
  })
  @IsOptional()
  @IsString()
  @Matches(Regex.PHONE, {
    message: ValidationMessagesEnum.PHONE,
  })
  phoneNumber: string;

  @ApiProperty({
    example: 'mymail@gmail.com',
    description: SwaggerMessagesEnum.DESCRIBE_EMAIL,
    required: true
  })
  @IsOptional()
  @IsEmail()
  @Matches(Regex.EMAIL, {
    message: ValidationMessagesEnum.EMAIL,
  })
  email: string;

  @ApiProperty({
    title: 'Attachment',
    description: SwaggerMessagesEnum.DESCRIBE_PROFILE_IMAGE,
    type: 'file',
    required: false,
  })
  @IsOptional()
  profileImage: any;

  @ApiProperty({
    example: '28-04-2000',
    description: SwaggerMessagesEnum.DESCRIBE_BIRTHDAY,
    required: false
  })
  @IsString()
  @IsNotEmpty()
  birthday: string;
}