import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({
      example: 'mymail@gmail.com | +380123123123 | username1111',
      description: 'Correct email address / phone / username',
    })
  @IsString()
  @IsNotEmpty()
  readonly login: string;
}