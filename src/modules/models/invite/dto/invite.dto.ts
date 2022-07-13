import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, isEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator"
import { SwaggerMessagesEnum } from "src/constants/messagesEnum/swaggerMessages.enum"
import { Regex } from "src/constants/regex"
import { Roles } from "src/constants/roles.enum"

export class InviteDto {
  @ApiProperty({
    example: 'Second Parent | Teenager | Other',
    description: SwaggerMessagesEnum.DESCRIBE_ROLE,
    required: false
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  role: string = Roles.OTHER
  
  @ApiProperty({
    example: '+380123123123',
    description: SwaggerMessagesEnum.DESCRIBE_PHONE_NUMBER,
    required: true
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(15)
  phoneNumber: string
  
  @ApiProperty({
    example: 'Andrew',
    description: SwaggerMessagesEnum.DESCRIBE_FIRST_NAME,
    required: false
  })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  firstName: string
  
  @ApiProperty({
    example: 'Yurchuk',
    description: SwaggerMessagesEnum.DESCRIBE_LAST_NAME,
    required: false
  })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  lastName: string
  
  @ApiProperty({
    example: 'mymail@gmail.com',
    description: SwaggerMessagesEnum.DESCRIBE_EMAIL,
    required: false
  })
  @IsNotEmpty()
  @IsEmail()
  @IsOptional()
  email: string
}