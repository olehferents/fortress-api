import { forwardRef, Module } from '@nestjs/common';
import { HouseholdService } from './household.service';
import { HouseholdController } from './household.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Household } from './entity/household.entity';
import { UserService } from '../user/user.service';
import { HouseholdMessage} from './entity/householdMessage.mongoEntity';
import { FileUploadService } from '../../file-upload/file-upload.service';
import { SocketModule } from '../../socket/socket.module';
import { Contact } from '../contact/entity/contact.entity';
import { ContactService } from '../contact/contact.service';
import { ContactMessage } from '../contact/entity/contactMessage.mongoEntity';
import { ContactModule } from '../contact/contact.module';
import { UserModule } from '../user/user.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { MissedCall } from 'src/modules/models/missedCall/entity/missedCall.entity';

@Module({
  imports: [
    SocketModule,
    ContactModule,
    NotificationModule,
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([
      HouseholdMessage,
      ContactMessage
    ], 'mongo'),
    TypeOrmModule.forFeature([
      User,
      Household,
      Contact,
      MissedCall
    ]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_EXP
      }
    }),
  ],
  providers: [
    HouseholdService,
    FileUploadService,
  ],
  controllers: [HouseholdController],
  exports: [HouseholdService]
})
export class HouseholdModule {}
