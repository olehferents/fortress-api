import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, MaxLength, IsOptional, IsBoolean } from "class-validator"
import { ValidationMessagesEnum } from "src/constants/messagesEnum"
import { SwaggerMessagesEnum } from "src/constants/messagesEnum/swaggerMessages.enum"
import { ToBoolean } from "src/helpers/validators/convertToBoolean.decorator"

export class ChildPermissionsDto {
  @ApiProperty({
    example: '1cbacfda-5509-4429-aa77-e67647bb2d6e',
    description: SwaggerMessagesEnum.DESCRIBE_CONTACT_ID,
    required: true,
  })
  @IsNotEmpty()
  @IsString({ message: ValidationMessagesEnum.CONTACT_ID })
  @MaxLength(36, { message: ValidationMessagesEnum.CONTACT_ID })
  id: string

  @ApiProperty({
    example: "true | false",
    description: SwaggerMessagesEnum.DESCRIBE_ACTION,
    required: true,
  })
  @IsNotEmpty()
  @IsBoolean({ message: ValidationMessagesEnum.ACTION})
  @ToBoolean()
  action: boolean

  @ApiProperty({
    example: 'villager | grandparent',
    description: SwaggerMessagesEnum.DESCRIBE_PERMISSION,
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString({ message: ValidationMessagesEnum.PERMISSION })
  permission: string = 'villager'
}