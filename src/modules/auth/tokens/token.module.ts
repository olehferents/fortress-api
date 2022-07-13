import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContactService } from "src/modules/models/contact/contact.service";
import { Contact } from "src/modules/models/contact/entity/contact.entity";
import { ContactMessage } from "src/modules/models/contact/entity/contactMessage.mongoEntity";
import { Household } from "src/modules/models/household/entity/household.entity";
import { HouseholdMessage } from "src/modules/models/household/entity/householdMessage.mongoEntity";
import { HouseholdService } from "src/modules/models/household/household.service";
import { User } from "src/modules/models/user/entities/user.entity";
import { UserModule } from "src/modules/models/user/user.module";
import { UserService } from "src/modules/models/user/user.service";
import { SocketModule } from "src/modules/socket/socket.module";
import { JwtStrategyConfig } from "../sign-in/jwt.strategy.config";
import { SignInController } from "../sign-in/signIn.controller";
import { SignInService } from "../sign-in/signIn.service";
import { RefreshToken } from "./entity/refreshToken.entity";
import { TokenService } from "./token.service";

@Module({
  imports: [
    SocketModule,
    UserModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([
      HouseholdMessage,
      ContactMessage,
    ], 'mongo'),
    TypeOrmModule.forFeature([
      User,
      Household,
      Contact,
      RefreshToken
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
  controllers: [],
  providers: [TokenService],
  exports: [TokenService]
})
export class TokenModule {}