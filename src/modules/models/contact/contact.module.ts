import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileUploadModule } from "src/modules/file-upload/file-upload.module";
import { FileUploadService } from "src/modules/file-upload/file-upload.service";
import { Household } from "src/modules/models/household/entity/household.entity";
import { HouseholdMessage } from "src/modules/models/household/entity/householdMessage.mongoEntity";
import { HouseholdService } from "src/modules/models/household/household.service";
import { NotificationModule } from "src/modules/notification/notification.module";
import { SocketModule } from "src/modules/socket/socket.module";
import { HouseholdModule } from "../household/household.module";
import { User } from "../user/entities/user.entity";
import { UserModule } from "../user/user.module";
import { UserService } from "../user/user.service";
import { ContactController } from "./contact.controller";
import { ContactService } from "./contact.service";
import { ContactBadge } from "./entity/contactBadge.entity";
import { Contact } from "./entity/contact.entity";
import { ContactMessage } from "./entity/contactMessage.mongoEntity";

@Module({
  imports: [
    SocketModule,
    FileUploadModule,
    NotificationModule,
    forwardRef(() => UserModule),
    forwardRef(() => HouseholdModule),
    TypeOrmModule.forFeature([
      HouseholdMessage,
      ContactMessage
    ], 'mongo'),
    TypeOrmModule.forFeature([
      User,
      Household,
      Contact,
      ContactBadge
    ]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_EXP
      }
    }),
  ],
  providers: [
    ContactService,
  ],
  controllers: [ContactController],
  exports: [ContactService],
})
export class ContactModule {}