import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Household } from 'src/modules/models/household/entity/household.entity';
import { HouseholdMessage} from 'src/modules/models/household/entity/householdMessage.mongoEntity';
import { HouseholdService } from 'src/modules/models/household/household.service';
import { ContactService } from 'src/modules/models/contact/contact.service';
import { Contact } from 'src/modules/models/contact/entity/contact.entity';
import { ContactMessage } from 'src/modules/models/contact/entity/contactMessage.mongoEntity';
import { User } from 'src/modules/models/user/entities/user.entity';
import { UserService } from 'src/modules/models/user/user.service';
import { SocketModule } from 'src/modules/socket/socket.module';
import { JwtStrategyConfig } from './jwt.strategy.config';
import { SignInController } from './signIn.controller';
import { SignInService } from './signIn.service';
import { TokenModule } from '../tokens/token.module';
import { UserModule } from 'src/modules/models/user/user.module';
import { HouseholdModule } from 'src/modules/models/household/household.module';
import { ContactModule } from 'src/modules/models/contact/contact.module';
import { Device } from 'src/modules/notification/entity/device.entity';

@Module({
  imports: [
    SocketModule,
    TokenModule,
    UserModule,
    ContactModule,
    HouseholdModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([
      HouseholdMessage,
      ContactMessage,
    ], 'mongo'),
    TypeOrmModule.forFeature([
      User,
      Household,
      Contact,
      Device
    ]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_EXP
      }
    }),
    PassportModule.register({
      defaultStrategy: 'jwt',
    })
  ],
  controllers: [SignInController],
  providers: [
    SignInService,
    JwtStrategyConfig,
  ],
  exports: [PassportModule, JwtStrategyConfig]
})
export class SignInModule {}
