import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { ValidationMessagesEnum } from "src/constants/messagesEnum";

export class SignInDto {
  @ApiProperty({
      example: 'mymail@gmail.com / +380961112233',
      description: 'Correct email address/phone number',
    })
  @IsString()
  @IsNotEmpty()
  readonly login: string;

  @ApiProperty({
    example: 'Qwerty1234',
    description:
    'Password which consist of at least one letter and one  digit 8+ characters long',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,60}$/, {
    message: ValidationMessagesEnum.PASSWORD,
  })
  readonly password: string;

  @ApiProperty({
    example: 'Qwerty1234',
    description:
    'Password which consist of at least one letter and one  digit 8+ characters long',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly deviceToken: string;
}