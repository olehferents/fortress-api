import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileUploadService } from "../file-upload/file-upload.service";
import { Household } from "../models/household/entity/household.entity";
import { HouseholdMessage } from "../models/household/entity/householdMessage.mongoEntity";
import { HouseholdService } from "../models/household/household.service";
import { ContactService } from "../models/contact/contact.service";
import { Contact } from "../models/contact/entity/contact.entity";
import { ContactMessage } from "../models/contact/entity/contactMessage.mongoEntity";
import { User } from "../models/user/entities/user.entity";
import { UserService } from "../models/user/user.service";
import { SocketModule } from "../socket/socket.module";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";
import { Device } from "./entity/device.entity";
import { UserModule } from "../models/user/user.module";

@Module({
  imports: [
    SocketModule,
    TypeOrmModule.forFeature([
      Device
    ]),
  ],
  providers: [
    NotificationService,
  ],
  controllers: [NotificationController],
  exports: [NotificationService]
})
export class NotificationModule {}