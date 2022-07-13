import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { HouseholdMessage } from 'src/modules/models/household/entity/householdMessage.mongoEntity';
import { SocketModule } from 'src/modules/socket/socket.module';
import { ContactMessage } from '../contact/entity/contactMessage.mongoEntity';
import { Household } from 'src/modules/models/household/entity/household.entity';
import { HouseholdService } from 'src/modules/models/household/household.service';
import { Contact } from '../contact/entity/contact.entity';
import { ContactReq } from 'src/modules/models/request/entity/request.entity';
import { RequestService} from 'src/modules/models/request/request.service';
import { ContactService } from '../contact/contact.service';
import { Invite } from '../invite/entity/invite.entity';
import { InviteService } from '../invite/invite.service';
import { ContactModule } from '../contact/contact.module';
import { HouseholdModule } from '../household/household.module';
import { InviteModule } from '../invite/invite.module';
import { RequestModule } from '../request/request.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { MissedCall } from 'src/modules/models/missedCall/entity/missedCall.entity';
import { HouseholdBadge } from '../household/entity/householdBadge.entity';

@Module({
  imports: [
    SocketModule,
    NotificationModule,
    forwardRef(() => ContactModule),
    forwardRef(() => HouseholdModule),
    forwardRef(() => RequestModule),
    forwardRef(() => InviteModule),
    TypeOrmModule.forFeature([HouseholdMessage, ContactMessage], 'mongo'),
    TypeOrmModule.forFeature([
      User,
      Household, 
      ContactReq,
      Invite, 
      MissedCall,
      HouseholdBadge
    ]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_EXP,
      },
    }),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}
