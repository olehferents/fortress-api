import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested, IsDefined, IsArray, MaxLength, IsString, IsNotEmpty } from "class-validator";
import { ValidationMessagesEnum } from "src/constants/messagesEnum";
import { SwaggerMessagesEnum } from "src/constants/messagesEnum/swaggerMessages.enum";
import { ChildPermissionsDto } from "./childPermissions.dto";

export class EditContactForChildrenDto {
  @ApiProperty({
    example: "53c56487-2dde-4c91-95d3-946483cddcc6",
    description: SwaggerMessagesEnum.DESCRIBE_CONTACT_ID,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(36, { message: ValidationMessagesEnum.CONTACT_ID})
  contactId: string


  @ApiProperty({
    example: ChildPermissionsDto,
    description: SwaggerMessagesEnum.DESCRIBE_CONTACT_ID,
    required: false,
    isArray: true,
    type: ChildPermissionsDto
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildPermissionsDto)
  children: ChildPermissionsDto[]

}