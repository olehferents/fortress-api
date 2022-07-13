import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Household } from 'src/modules/models/household/entity/household.entity';
import { HouseholdMessage } from 'src/modules/models/household/entity/householdMessage.mongoEntity';
import { HouseholdService } from 'src/modules/models/household/household.service';
import { MailService } from 'src/modules/mail/mail.service';
import { ContactService } from 'src/modules/models/contact/contact.service';
import { Contact } from 'src/modules/models/contact/entity/contact.entity';
import { ContactMessage } from 'src/modules/models/contact/entity/contactMessage.mongoEntity';
import { User } from 'src/modules/models/user/entities/user.entity';
import { UserService } from 'src/modules/models/user/user.service';
import { SocketModule } from 'src/modules/socket/socket.module';
import { ResetPasswordController } from './reset-password.controller';
import { ResetPasswordService } from './reset-password.service';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { ContactModule } from 'src/modules/models/contact/contact.module';
import { HouseholdModule } from 'src/modules/models/household/household.module';
import { UserModule } from 'src/modules/models/user/user.module';
import { MailModule } from 'src/modules/mail/mail.module';

@Module({
  imports: [
    SocketModule,
    NotificationModule,
    HouseholdModule,
    UserModule,
    ContactModule,
    MailModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([
      User,
      Household,
      Contact
    ]),
    TypeOrmModule.forFeature([
      HouseholdMessage,
      ContactMessage
    ], 'mongo'),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_EXP
      }
    }),
  ],
  controllers: [ResetPasswordController],
  providers: [ResetPasswordService, MailService]
})
export class ResetPasswordModule {}
