import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SocketGateway } from "src/modules/socket/socket.gateway";
import { SocketModule } from "src/modules/socket/socket.module";
import { ContactModule } from "../contact/contact.module";
import { ContactService } from "../contact/contact.service";
import { Contact } from "../contact/entity/contact.entity";
import { ContactMessage } from "../contact/entity/contactMessage.mongoEntity";
import { Household } from "../household/entity/household.entity";
import { HouseholdMessage } from "../household/entity/householdMessage.mongoEntity";
import { HouseholdModule } from "../household/household.module";
import { HouseholdService } from "../household/household.service";
import { ContactReq } from "../request/entity/request.entity";
import { RequestModule } from "../request/request.module";
import { RequestService } from "../request/request.service";
import { User } from "../user/entities/user.entity";
import { UserModule } from "../user/user.module";
import { UserService } from "../user/user.service";
import { Invite } from "./entity/invite.entity";
import { InviteController } from "./invite.controller";
import { InviteService } from "./invite.service";

@Module({
  imports: [
    SocketModule,
    forwardRef(()=>HouseholdModule),
    RequestModule,
    forwardRef(()=>ContactModule),
    forwardRef(()=>UserModule),
    TypeOrmModule.forFeature([HouseholdMessage, ContactMessage], 'mongo'),
    TypeOrmModule.forFeature([User, Household, Contact, ContactReq, Invite]),
  ],
  providers: [
    InviteService, 
    //UserService, 
    // HouseholdService, 
    // ContactService, 
    // RequestService
  ],
  controllers: [InviteController],
  exports: [InviteService],
})
export class InviteModule {}