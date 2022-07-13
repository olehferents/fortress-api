
import { Controller, UseGuards, Post, Req, Res, HttpStatus, Query, Get, Body } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { DeviceDto } from "./dto/device.dto";
import { Device } from "./entity/device.entity";
import { NotificationService } from "./notification.service";

@ApiBearerAuth()
@ApiTags('Notification')
@UseGuards(AuthGuard('jwt'))
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  
  @Post('/token')
  public async getDeviceToken(
    @Req() req,
    @Res() res,
    @Body() deviceDto: DeviceDto,
  ): Promise<void> {
    try {
      console.log(deviceDto)
      await this.notificationService.connectDeviceToUserProfile(deviceDto, req.user)
      res.status(HttpStatus.OK).json({ message: 'Device connected successfully!'});
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }

  @Get('/device/tokens')
  public async getAllDeviceTokensForUser(
    @Req() req,
    @Res() res,
  ): Promise<void>{
    try {
      const devices  = await this.notificationService.findDeviceTokensForUser([req.user])
      res.status(HttpStatus.OK).json(devices.length > 0 ? {devices} : null);
    } catch (err) {
      res
        .status(err.status || HttpStatus.CONFLICT)
        .json({ message: err.detail || err.message });
    }
  }
}