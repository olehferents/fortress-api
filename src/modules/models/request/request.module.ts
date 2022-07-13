import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { forwardRef, Module } from '@nestjs/common';
import { FileUploadService } from "../../file-upload/file-upload.service";
import { Household } from "../household/entity/household.entity";
import { HouseholdMessage } from "../household/entity/householdMessage.mongoEntity";
import { HouseholdController } from "../household/household.controller";
import { HouseholdService } from "../household/household.service";
import { UserService } from "../user/user.service";
import { RequestController } from "./request.controller";
import { RequestService } from "./request.service";
import { AppModule } from "src/app.module";
import { SocketModule } from "../../socket/socket.module";
import { Contact } from "../contact/entity/contact.entity";
import { ContactReq } from "./entity/request.entity";
import { ContactMessage } from "../contact/entity/contactMessage.mongoEntity";
import { ContactService } from "../contact/contact.service";
import { User } from "../user/entities/user.entity";
import { HouseholdModule } from "../household/household.module";
import { ContactModule } from "../contact/contact.module";
import { InviteModule } from "../invite/invite.module";
import { UserModule } from "../user/user.module";
import { FileUploadModule } from "src/modules/file-upload/file-upload.module";
import { NotificationModule } from "src/modules/notification/notification.module";
import { ContactBadge } from "../contact/entity/contactBadge.entity";

@Module({
  imports: [
    forwardRef(()=>HouseholdModule),
    forwardRef(()=>ContactModule),
    forwardRef(()=>UserModule),
    forwardRef(()=>NotificationModule),
    SocketModule,
    FileUploadModule,
    TypeOrmModule.forFeature([
      HouseholdMessage,
      ContactMessage
    ], 'mongo'),
    TypeOrmModule.forFeature([
      User,
      Household,
      ContactReq,
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
    RequestService,
  ],
  controllers: [RequestController],
  exports: [RequestService]
})
export class RequestModule {}
