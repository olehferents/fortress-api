import {
  CanActivate,
  ExecutionContext,
  Injectable,
  mixin,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Roles } from 'src/constants/roles.enum'
import { UserService } from 'src/modules/models/user/user.service'

export const RolesGuard = (requiredRoles: string[]) => {
  @Injectable()
  class RolesGuardMixin implements CanActivate {
    constructor(
      private readonly jwtService: JwtService,
      private readonly userService: UserService,
      private readonly configService: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext) {
      const request = context.switchToHttp().getRequest()
      const bearerHeader = request.headers['authorization']
      let accessToken: string
      if (bearerHeader?.startsWith('Bearer ')) {
        accessToken = bearerHeader.substring(7, bearerHeader.length)
      } else {
        throw new UnauthorizedException()
      }
      const candidate = this.jwtService.verify(accessToken, {
        secret: process.env.JWT_ACCESS_SECRET,
      })
      let user = await this.userService.findByUniqueFieldWithRelations({
        id: candidate.userId
      }, [])
      return !!requiredRoles.includes(user?.role)
    }
  }

  const guard = mixin(RolesGuardMixin)
  return guard
}
