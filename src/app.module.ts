import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TwilioModule } from 'nestjs-twilio';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { EditProfileModule } from './modules/edit-profile/editProfile.module';
import { UserModule } from './modules/models/user/user.module';
import { ModelsModule } from './modules/models/models.module';
import { HouseholdModule } from './modules/models/household/household.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { MailService } from './modules/mail/mail.service';
import { MailModule } from './modules/mail/mail.module';
import { RequestModule } from './modules/models/request/request.module';
import { ContactModule } from './modules/models/contact/contact.module';
import { NotificationModule } from './modules/notification/notification.module';
import { InviteModule } from './modules/models/invite/invite.module';
import { MissedCall } from 'src/modules/models/missedCall/entity/missedCall.entity';

// console.log(`mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_NAME}?authSource=admin&readPreference=primary&appname=Fortress&ssl=false`)
@Module({
  imports: [
    AuthModule, 
    EditProfileModule,
    UserModule,
    ModelsModule,
    HouseholdModule,
    FileUploadModule,
    MailModule,
    RequestModule,
    ContactModule,
    NotificationModule,
    InviteModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      name: 'default',
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: +process.env.POSTGRES_PORT,
      username: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_NAME,
      entities: ['dist/**/*.entity.{js,ts}'],
      migrations: ["dist/migrations/*{.ts,.js}"],
      synchronize: true,
      logging: false,
      autoLoadEntities: true,
    }),
    TypeOrmModule.forRoot({
      name: 'mongo',
      type: 'mongodb',
      url: `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_NAME}?authSource=admin&readPreference=primary&appname=Fortress&ssl=false`,
      entities: ["dist/**/*.mongoEntity{.ts,.js}"],
      migrations: ["dist/migrations/*{.ts,.js}"],
      synchronize: true,
      logging: false,
      autoLoadEntities: true,
    }),
    TwilioModule.forRoot({
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MailService,
  ],
})
export class AppModule {}
