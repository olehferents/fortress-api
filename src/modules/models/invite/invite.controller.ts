import { Body, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common'
import { Controller } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { InviteDto } from './dto/invite.dto'
import { InviteMultipleDto } from './dto/inviteMultiple.dto'
import { Invite } from './entity/invite.entity'
import { InviteService } from './invite.service'

@ApiTags('Invites')
@ApiUnauthorizedResponse({ description: 'Provide valid access token!' })
@ApiOkResponse({ description: 'Invitation(s) was(were) sent successfully!'})
@ApiBearerAuth()
@Controller('invite')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post('send')
  @UseGuards(AuthGuard('jwt'))
  public async sendInvitation(
    @Req() req,
    @Res() res,
    @Body() invite: InviteDto
  ): Promise<void> {
    try {

      await this.inviteService.sendInvitation(invite, req.user)

      res.status(HttpStatus.OK).json({message: 'Invitation was sent successfully!'})
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message })
    }
  }

  @Post('send/multiple')
  @UseGuards(AuthGuard('jwt'))
  public async sendMultipleInvites(
    @Req() req,
    @Res() res,
    @Body() {invites}: InviteMultipleDto
  ): Promise<void> {
    try {  
      invites?.forEach((invite: InviteDto) => {
        console.log(invite)
        this.inviteService.sendInvitationOrRequest(invite, req.user)
      })

      res.status(HttpStatus.OK).json({message: 'Invitations were sent successfully!'})
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message })
    }
  }
}
