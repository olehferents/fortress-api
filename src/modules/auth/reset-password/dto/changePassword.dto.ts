import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { MatchTwoFields } from "src/helpers/validators/matchTwoField.decorator";
import { UnmatchTwoFields } from "src/helpers/validators/unmatchTwoField.decorator";

export class ChangePasswordDto {
  @ApiProperty({
      example: 'Qwerty1234',
      description: 'Old password here',
      required: true
    })
  @IsString()
  @IsNotEmpty()
  readonly oldPwd: string;

  @ApiProperty({
    example: 'Qwerty1234',
    description: 'Repeat new password',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  @MatchTwoFields('newPwd')
  readonly repeatPwd: string;

  @ApiProperty({
    example: 'Qwerty1234',
    description: 'New password here',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  readonly newPwd: string;

  @ApiProperty({
    example: '7c7ddee7-440f-44de-8e87-91dea4384ea5',
    description: 'UUID of child',
    required: false
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly childId: string;
}