import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../models/user/entities/user.entity';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendForgotPasswordMail(user: User, pwd: string) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Fortress reset forgotten password',
      template: './forgotPassword',
      context: {
        name: `${user.firstName} ${user.lastName}`,
        pwd
      }
    })
  }

  async sendForgotPasswordMailToParent(parent: User, child: User, pwd: string) {
    await this.mailerService.sendMail({
      to: parent.email,
      subject: 'Fortress reset forgotten password of your child',
      template: './forgotPasswordChild',
      context: {
        parentName: `${parent.firstName} ${parent.lastName}`,
        childName: `${child.firstName} ${child.lastName}`,
        pwd
      }
    })
  }
}
