import { Controller, Get } from "@nestjs/common";
import { Public } from "@/auth/decorators/user.decorator";

@Controller("health")
export class HealthController {
  @Public()
  @Get()
  ping(): string {
    return "still alive and kicking! 🕺💃 (wallet API is healthy)";
  }
}
