import { Module } from "@nestjs/common";
import { SocketGateway } from "./socket.gateway";

@Module({
  imports: [],
  controllers: [],
  providers: [
    SocketGateway,
  ],
  exports: [
    SocketGateway
  ]
})
export class SocketModule {}