import * as bcrypt from 'bcryptjs';
var moment = require('moment');
import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SignUpParentDto } from './dto/signUpParent.dto';
import { InjectTwilio, TwilioClient } from 'nestjs-twilio';
import { SignUpChildDto } from './dto/signUpChild.dto';
import { SignUpSecondParentDto } from './dto/signUpSecondParent.dto';
import { SignUpOtherDto } from './dto/signUpOther.dto';
import { User } from 'src/modules/models/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from 'src/modules/models/user/user.service';
import { UserDto } from 'src/modules/models/user/dto/user.dto';
import { InviteService } from 'src/modules/models/invite/invite.service';
import { Roles } from 'src/constants/roles.enum';

@Injectable()
export class SignUpService {
  constructor(
    @InjectTwilio() private readonly twilioClient: TwilioClient,
    private readonly userService: UserService,
    private readonly inviteService: InviteService,
  ) {}

  public async signUpParent(
    registerParentDto: SignUpParentDto,
  ): Promise<UserDto> {
    registerParentDto.password = await bcrypt.hash(
      registerParentDto.password,
      10,
    );
    registerParentDto.email = registerParentDto.email.toLowerCase();
    registerParentDto.username = registerParentDto.username.toLowerCase();

    const invite = await this.inviteService.getLatestInviteByPhone(registerParentDto.phoneNumber)
  
    if (invite?.role === Roles.SECOND_PARENT && !!invite?.invitedBy?.household?.id) 
      return await this.userService.createSecondParent(registerParentDto, invite.invitedBy);
    

    return this.userService.createParent(registerParentDto);
  }

  public async signUpOther(registerOtherDto: SignUpOtherDto): Promise<UserDto | void> {
    try {
      registerOtherDto.password = await bcrypt.hash(
        registerOtherDto.password,
        10,
      );
      registerOtherDto.email = registerOtherDto.email.toLowerCase();
      registerOtherDto.username = registerOtherDto.username.toLowerCase();
  
      const invite = await this.inviteService.getLatestInviteByPhone(registerOtherDto.phoneNumber)
  
      switch (invite?.role) {
        case Roles.OTHER:
          return await this.userService.createOther(registerOtherDto);
          break;
        case Roles.SECOND_PARENT:
          console.log(invite.invitedBy);
          if (invite.invitedBy.household.id)
            return await this.userService.createSecondParent(registerOtherDto, invite.invitedBy);
          break
        case Roles.TEENAGER:
          if (invite.invitedBy.household.id)
            return await this.userService.createTeenager(registerOtherDto, invite.invitedBy);
          break        
      }
      return await this.userService.createOther(registerOtherDto);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(err)
    }
  }

  // public async signUpSecondParent(
  //   registerSecondParentDto: SignUpSecondParentDto,
  // ): Promise<UserDto> {
  //   registerSecondParentDto.password = await bcrypt.hash(
  //     registerSecondParentDto.password,
  //     10,
  //   );
  //   registerSecondParentDto.email = registerSecondParentDto.email.toLowerCase();
  //   registerSecondParentDto.username = registerSecondParentDto.username.toLowerCase();
  //   return this.userService.createSecondParent(registerSecondParentDto);
  // }

  public async signUpChild(
    registerChildDto: SignUpChildDto,
    parent: User,
  ): Promise<UserDto> {
    try {
      registerChildDto.password = await bcrypt.hash(
        registerChildDto.password,
        10,
      );
      registerChildDto.email = registerChildDto?.email?.toLowerCase();
      registerChildDto.username = registerChildDto?.username?.toLowerCase()
  
      const age = moment().diff(
        moment(registerChildDto.birthday, 'DD/MM/YYYY'),
        'years',
        false,
      );
      if (age < 3) {
        throw new ForbiddenException('Too young to use this app');
      } else if (age >= 18) {
        throw new ForbiddenException('Too young to use this app as child');
      } else {
        return this.userService.createChild(registerChildDto, parent);
      }
     } catch (err) {
      // console.log(err)
      throw new ConflictException(err);
    }
    
  }

  public async signUpTeenager(
    registerTeenagerDto: SignUpChildDto,
    parent: User,
  ): Promise<UserDto> {
    registerTeenagerDto.password = await bcrypt.hash(
      registerTeenagerDto.password,
      10,
    );
    registerTeenagerDto.email = registerTeenagerDto.email.toLowerCase();

    const age = moment().diff(
      moment(registerTeenagerDto.birthday, 'DD/MM/YYYY'),
      'years',
      false,
    );
    if (age < 12) {
      throw new ForbiddenException('To young. Register as child please');
    } else if (age >= 18) {
      throw new ForbiddenException('Too old to use this app as teenager');
    } else {
      return this.userService.createTeenager(registerTeenagerDto, parent);
    }
  }

  public async sendVerificationSMS(targetPhone: string) {
    return await this.twilioClient.verify
      .services(process.env.TWILIO_VERIFICATION_SERVICE)
      .verifications.create({ to: targetPhone, channel: 'sms' })
      .then((verification) => verification.status);
  }

  public async checkVerificationCode(targetPhone: string, code: string) {
    // return code === '1111' ? 'approved' : 'pending';
    return await this.twilioClient.verify
      .services(process.env.TWILIO_VERIFICATION_SERVICE)
      .verificationChecks.create({ to: targetPhone, code })
      .then((verificationCheck) => verificationCheck.status);
  }
}
