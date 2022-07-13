import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/user/entities/user.entity';
import { UserService } from '../models/user/user.service';
import { EditChildProfileDto } from './dto/editChildProfile.dto';
import { EditUserProfileDto } from './dto/editUserProfile.dto';

@Injectable()
export class EditProfileService {
  constructor(
    private readonly userService: UserService,
  ) {}

  public async user(user: User, editUserProfileDto: EditUserProfileDto) {
    editUserProfileDto['id'] = user.id;
    await this.userService.update(editUserProfileDto)
  }
  
  public async child(user: User, editChildProfileDto: EditChildProfileDto) {
    editChildProfileDto['id'] = user.id;
    await this.userService.update(editChildProfileDto)
  }
}
