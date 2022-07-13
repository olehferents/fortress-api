import * as bcrypt from 'bcryptjs';
var moment = require('moment');
import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectTwilio, TwilioClient } from 'nestjs-twilio';
import { User } from 'src/modules/models/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from 'src/modules/models/user/user.service';
import { UserDto } from 'src/modules/models/user/dto/user.dto';
import { InviteService } from 'src/modules/models/invite/invite.service';
import { Roles } from 'src/constants/roles.enum';
import { RefreshToken } from './entity/refreshToken.entity';
import { JwtService } from '@nestjs/jwt';
import { SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { UnprocessableEntityException } from '@nestjs/common';
import { RefreshTokenPayload } from './interface/refreshTokenPayload.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly userService: UserService,
  ) {}

  public async createRefreshToken(user: User, ttl: number): Promise<RefreshToken> {
    try {
      const token = this.refreshTokenRepository.create()
      token.user = user;
      token.isRevoked = false;
      const expiration = new Date()
      expiration.setTime(expiration.getTime() + ttl)
      token.expires = expiration
      await this.refreshTokenRepository.save(token)
      return token
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  public async findRefreshTokenById(id: string): Promise<RefreshToken> {
    return await this.refreshTokenRepository.findOne(id)
  }
  
  public async generateRefreshToken(user: User, expiresIn: number): Promise<string> {
    const token = await this.createRefreshToken(user, expiresIn)
    const opts: SignOptions = {
      expiresIn,
      subject: String(user.id),
      jwtid: String(token.id),
    } 
    return this.jwtService.signAsync({}, opts)
  }

  public async generateAccessToken(user: Partial<User>): Promise<string> {
    const opts: SignOptions = {
      subject: String(user.id),
    } 
    return this.jwtService.signAsync({userId: user.id},opts)
  }

  public async resolveRefreshToken(encoded: string): Promise<{user: User, token: RefreshToken}> {
    const payload = await this.decodeRefreshToken(encoded)
    const token = await this.getStoredTokenFromRefreshTokenPayload(payload)

    if (!token)
      throw new UnprocessableEntityException('RefreshToken not found')
    if (token.isRevoked)
      throw new UnprocessableEntityException('RefreshToken revoked')

    const user = await this.getUserFromRefreshTokenPayload(payload)

    if (!user)
      throw new UnprocessableEntityException('RefreshToken malformed')

    return {user, token}
  }

  public async deleteRefreshToken(refreshToken: string): Promise<void> {
    const tokenId = (await this.decodeRefreshToken(refreshToken)).jti
    await this.refreshTokenRepository.delete(tokenId)
  }

  public async createAccessTokenFromRefreshToken(oldRefreshToken: string): Promise<{user: User, accessToken: string, newRefreshToken: string}> {
    const {user} = await this.resolveRefreshToken(oldRefreshToken)
    await this.deleteRefreshToken(oldRefreshToken)
    const accessToken = await this.generateAccessToken(user)
    const newRefreshToken = await this.generateRefreshToken(user, 60 * 60 * 24 * 30)
    return {user, accessToken, newRefreshToken}
  }


  private async decodeRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      return this.jwtService.verifyAsync(token)
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnprocessableEntityException('Resfresh token expired!')
      } else {
        throw new UnprocessableEntityException('Refresh token malformed!')
      }
    }
  }

  private async getUserFromRefreshTokenPayload(payload: RefreshTokenPayload): Promise<User>{
    const subId = payload.sub
    if (!subId)
      throw new UnprocessableEntityException('Refresh token malformed!')
    return await this.userService.findByUniqueFieldWithRelations({id: subId})
  }

  private async getStoredTokenFromRefreshTokenPayload(payload: RefreshTokenPayload): Promise<RefreshToken | null> {
    const tokenId = payload.jti
    if (!tokenId)
      throw new UnprocessableEntityException('Refresh token malformed!')
    return this.refreshTokenRepository.findOne(tokenId)
  }
}
