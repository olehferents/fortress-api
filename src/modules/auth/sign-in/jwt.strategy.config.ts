import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Roles } from 'src/constants/roles.enum';
import { User } from 'src/modules/models/user/entities/user.entity';
import { UserService } from 'src/modules/models/user/user.service';
import { Repository } from 'typeorm';
import { JwtPayloadInterface } from './interfaces/jwt.payload.interface';

@Injectable()
export class JwtStrategyConfig extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
      passReqToCallback: true,
      signOptions: {
        expires: process.env.JWT_ACCESS_EXP
      }
    })
  }

  async validate(req: Request, payload: JwtPayloadInterface) {
    const { userId } = payload
    let user = await this.userService.findByUniqueFieldWithRelations(
      {id: userId}, 
      ['contacts', 'household', 'household.users',
      'household.users.contacts','inReq', 'outReq']
      )
    if (!user) {
      throw new UnauthorizedException()
    }
    return user
  }
}
