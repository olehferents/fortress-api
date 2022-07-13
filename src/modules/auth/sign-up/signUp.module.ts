import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploadService } from 'src/modules/file-upload/file-upload.service';
import { Household } from 'src/modules/models/household/entity/household.entity';
import { HouseholdMessage} from 'src/modules/models/household/entity/householdMessage.mongoEntity';
import { HouseholdService} from 'src/modules/models/household/household.service';
import { ContactService } from 'src/modules/models/contact/contact.service';
import { Contact } from 'src/modules/models/contact/entity/contact.entity';
import { ContactMessage } from 'src/modules/models/contact/entity/contactMessage.mongoEntity';
import { User } from 'src/modules/models/user/entities/user.entity';
import { UserService } from 'src/modules/models/user/user.service';
import { SocketModule } from 'src/modules/socket/socket.module';
import { SignUpController } from './signUp.controller';
import { SignUpService } from './signUp.service';
import { InviteService } from 'src/modules/models/invite/invite.service';
import { Invite } from 'src/modules/models/invite/entity/invite.entity';
import { RequestService } from 'src/modules/models/request/request.service';
import { ContactReq } from 'src/modules/models/request/entity/request.entity';
import { HouseholdModule } from 'src/modules/models/household/household.module';
import { UserModule } from 'src/modules/models/user/user.module';
import { InviteModule } from 'src/modules/models/invite/invite.module';

@Module({
  imports: [
  SocketModule,
  HouseholdModule,
  UserModule,
  InviteModule,
  TypeOrmModule.forFeature([
    HouseholdMessage,
    ContactMessage,
  ], 'mongo'),
  TypeOrmModule.forFeature([
    User,
    Household,
    Contact,
    Invite,
    ContactReq
  ]),
  JwtModule.register({
    secret: process.env.JWT_ACCESS_SECRET,
    signOptions: {
      expiresIn: process.env.JWT_ACCESS_EXP
  }
  }),
],
  controllers: [SignUpController],
  providers: [
    SignUpService, 
    FileUploadService,
  ],
  exports: [SignUpService]
})
export class SignUpModule {}
