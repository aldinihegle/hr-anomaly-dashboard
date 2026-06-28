import { Body, Controller, Post, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() signInDto: Record<string, any>) {
    return this.authService.login(signInDto.email, signInDto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return this.authService.getMe(req.user.id || req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('onboarding-done')
  async completeOnboarding(@Request() req: any) {
    await this.authService.markOnboardingDone(req.user.id || req.user.sub);
    return { success: true };
  }
}
