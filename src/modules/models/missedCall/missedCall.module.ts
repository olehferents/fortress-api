import { Module } from "@nestjs/common";
import { forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileUploadModule } from "src/modules/file-upload/file-upload.module";
import { NotificationModule } from "src/modules/notification/notification.module";
import { SocketModule } from "src/modules/socket/socket.module";
import { ContactModule } from "../contact/contact.module";
import { Contact } from "../contact/entity/contact.entity";
import { Household } from "../household/entity/household.entity";
import { HouseholdModule } from "../household/household.module";
import { ContactReq } from "../request/entity/request.entity";
import { User } from "../user/entities/user.entity";
import { UserModule } from "../user/user.module";
import { MissedCall } from "src/modules/models/missedCall/entity/missedCall.entity";
import { MissedCallController } from "./missedCall.controller";
import { MissedCallService } from "./missedCall.service";

@Module({
  imports: [
    forwardRef(()=>HouseholdModule),
    forwardRef(()=>ContactModule),
    forwardRef(()=>UserModule),
    forwardRef(()=>NotificationModule),
    SocketModule,
    FileUploadModule,
    TypeOrmModule.forFeature([
      User,
      Household,
      ContactReq,
      Contact,
      MissedCall
    ]),
  ],
  providers: [    
    MissedCallService,
  ],
  controllers: [
    MissedCallController
  ],
  exports: [
    MissedCallService
  ]
})
export class MissedCallModule {}