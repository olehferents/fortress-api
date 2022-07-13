import { User } from "src/modules/models/user/entities/user.entity";

export interface AuthenticationPayload {
  user: User
  payload: {
    type: string
    accessToken: string
    refreshToken?: string
  }
}