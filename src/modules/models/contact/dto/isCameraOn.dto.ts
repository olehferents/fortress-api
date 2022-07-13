import { ApiProperty } from '@nestjs/swagger';

export class IsCameraOnDto{
  @ApiProperty({
    required: true
  })
  isCameraOn: boolean
}