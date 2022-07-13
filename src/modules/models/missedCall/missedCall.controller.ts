import { Controller, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiConsumes } from "@nestjs/swagger";
import { RequestService } from "../request/request.service";
// import { MissedCallService } from "./missedCall.service";

@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Provide valid access token!' })
@ApiForbiddenResponse({ description: 'Not enough permissions to perform this action!' })
@ApiConsumes('multipart/form-data')
@Controller('missed-call')
@UseGuards(AuthGuard('jwt'))
export class MissedCallController {
  // constructor(private readonly missedCallService: MissedCallService) {}
}