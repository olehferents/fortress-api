import { Module } from '@nestjs/common';
import { SignUpModule } from './sign-up/signUp.module';
import { ResetPasswordModule } from './reset-password/reset-password.module';
import { SignInModule } from './sign-in/signIn.module';

@Module({
  imports: [SignUpModule, SignInModule, ResetPasswordModule],
  exports: [SignUpModule, SignInModule, ResetPasswordModule],
})
export class AuthModule {}
