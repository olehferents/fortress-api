import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Regex } from 'src/constants/regex';
import { MailService } from 'src/modules/mail/mail.service';
import { User } from 'src/modules/models/user/entities/user.entity';
import { UserService } from 'src/modules/models/user/user.service';
import { Repository } from 'typeorm';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { HouseholdService } from 'src/modules/models/household/household.service';
import { Roles } from 'src/constants/roles.enum';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { MessagesEnum } from 'src/constants/messagesEnum/messages.enum';

@Injectable()
export class ResetPasswordService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly householdService: HouseholdService
  ) {}

  async sendForgotPasswordRequest(forgotPasswordDto: ForgotPasswordDto) {
    try {
      let user = await this.userService.findByLogin(forgotPasswordDto.login)
      const pwd = this.generatePassword()
      user.password = await bcrypt.hash(pwd, 10)
      await this.userService.save(user)
      if (user && user.role !== Roles.CHILD) {
        await this.mailService.sendForgotPasswordMail(user, pwd)
      } else if (user && user.role === Roles.CHILD) {
        let household = await this.householdService.findOne(user, {users: true})
        household.users.forEach(
          async candidate => 
            candidate.role === Roles.PARENT || candidate.role === Roles.SECOND_PARENT ? 
            await this.mailService.sendForgotPasswordMailToParent(candidate, user, pwd) : null
        )
      }        
    } catch (err) {
      console.error(err)
      throw new InternalServerErrorException(err)
    }
  }

  generatePassword() {
    const alphanum = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < 11; i++) {
      password += alphanum.charAt(
        Math.floor(Math.random() * alphanum.length)
      );
    }
    return password;
  }

  async changePassword(changePasswordDto: ChangePasswordDto, user: User) {
    try {
      if (await bcrypt.compare(changePasswordDto.newPwd, user.password)) {
        throw new ConflictException(MessagesEnum.SAME_NEW_PASSWORD);
      } else {
        user.password = await bcrypt.hash(changePasswordDto.newPwd, 10)
        await this.userService.save(user)
      } 
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  async changePasswordForChild(changePasswordDto: ChangePasswordDto, user: User) {
    try {
      let child = await this.userService.findByUniqueFieldWithRelations({id: changePasswordDto.childId}, ['household'])
      if (!child) 
        throw new NotFoundException('Child with id ' + changePasswordDto.childId + ' not found')
      if (
        !(child?.household?.id === user?.household?.id && 
        [Roles.PARENT as string, Roles.SECOND_PARENT as string].includes(user.role))
      ) {
        throw new ForbiddenException('You don\'t have permission to change password of this child!')
      }
      if (await bcrypt.compare(changePasswordDto.newPwd, child.password)) {
        throw new ConflictException(MessagesEnum.SAME_NEW_PASSWORD);
      } else {
        child.password = await bcrypt.hash(changePasswordDto.newPwd, 10)
        await this.userService.save(child)
      } 
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }
}
