import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIU.........FKW_A9oqJ0cn9sa01iPlrE',
    description: 'Your refresh token to generete ne access token',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  readonly refreshToken: string
}