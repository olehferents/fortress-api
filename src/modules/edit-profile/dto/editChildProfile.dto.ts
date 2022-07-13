import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength, Matches, IsOptional } from "class-validator";
import { ValidationMessagesEnum } from "src/constants/messagesEnum";
import { SwaggerMessagesEnum } from "src/constants/messagesEnum/swaggerMessages.enum";
import { Regex } from "src/constants/regex";

export class EditChildProfileDto {
  @ApiProperty({
    example: 'Pavlov',
    description: SwaggerMessagesEnum.DESCRIBE_FIRST_NAME,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40, { message: ValidationMessagesEnum.FIRST_NAME })
  readonly firstName: string;
  
  @ApiProperty({
    example: 'Boychuk',
    description: SwaggerMessagesEnum.DESCRIBE_LAST_NAME,
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40, { message: ValidationMessagesEnum.LAST_NAME })
  readonly lastName: string;

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
    example: 'mymail@gmail.com',
    description: SwaggerMessagesEnum.DESCRIBE_EMAIL,
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(Regex.EMAIL, { message: ValidationMessagesEnum.EMAIL })
  email: string = null;
  
  @ApiProperty({
    example: '+380665551799',
    description: SwaggerMessagesEnum.DESCRIBE_PHONE_NUMBER,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  phoneNumber: string = null;
  
  @ApiProperty({
    example: '28/04/2010',
    description: SwaggerMessagesEnum.DESCRIBE_BIRTHDAY,
    required: false
  })
  @IsString()
  birthday: string;
  
  @ApiProperty({
    title: 'Attachment',
    description: SwaggerMessagesEnum.DESCRIBE_PROFILE_IMAGE,
    type: 'file',
    required: false,
  })
  @IsOptional()
  profileImage: any = null;
}