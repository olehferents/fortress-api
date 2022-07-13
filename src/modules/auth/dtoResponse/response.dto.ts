import { User } from "src/modules/models/user/entities/user.entity";

export interface ResponseDto {
    status?: number;
    code?: string;
    message?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
  }