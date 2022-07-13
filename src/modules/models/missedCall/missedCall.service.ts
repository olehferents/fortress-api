import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NotificationService } from "src/modules/notification/notification.service";
import { SocketGateway } from "src/modules/socket/socket.gateway";
import { Repository, Connection } from "typeorm";
import { Contact } from "../contact/entity/contact.entity";
import { HouseholdService } from "../household/household.service";
import { ContactReq } from "../request/entity/request.entity";
import { UserService } from "../user/user.service";

@Injectable()
export class MissedCallService {
  constructor(
  ) {}


}