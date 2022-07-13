import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Matches } from 'class-validator'
import { ValidationMessagesEnum } from 'src/constants/messagesEnum'

export class SignOutDto {
  @ApiProperty({
    example: 'mymail@gmail.com / +380961112233',
    description: 'Correct email address/phone number',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  readonly deviceToken: string
}
