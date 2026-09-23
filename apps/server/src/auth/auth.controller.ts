import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuditLog } from '@/audit-log/decorators/audit-log.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@ApiTags('Authentication')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('tokens')
  @AuditLog('auth.login')
  @ApiOperation({ summary: 'Create a JWT access token' })
  @ApiCreatedResponse({ type: TokenResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  create(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
