import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploadService } from '../file-upload/file-upload.service';
import { Household } from '../models/household/entity/household.entity';
import { HouseholdMessage} from '../models/household/entity/householdMessage.mongoEntity';
import { HouseholdService } from '../models/household/household.service';
import { ContactService } from '../models/contact/contact.service';
import { Contact } from '../models/contact/entity/contact.entity';
import { ContactMessage } from '../models/contact/entity/contactMessage.mongoEntity';
import { User } from '../models/user/entities/user.entity';
import { UserService } from '../models/user/user.service';
import { SocketModule } from '../socket/socket.module';
import { EditProfileController } from './editProfile.controller';
import { EditProfileService } from './editProfile.service';
import { NotificationModule } from '../notification/notification.module';
import { ContactModule } from '../models/contact/contact.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { HouseholdModule } from '../models/household/household.module';
import { UserModule } from '../models/user/user.module';
import { MissedCall } from 'src/modules/models/missedCall/entity/missedCall.entity';

@Module({
  imports: [
    SocketModule,
    NotificationModule,
    ContactModule,
    FileUploadModule,
    HouseholdModule,
    UserModule,
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
  controllers: [EditProfileController],
  providers: [EditProfileService]
})
export class EditProfileModule {}
