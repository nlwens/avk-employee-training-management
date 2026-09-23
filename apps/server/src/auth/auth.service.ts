import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { UsersService } from '@/users/users.service';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { AuditAction } from '@/audit-log/enums/audit-action.enum';
import { JwtPayload } from './auth';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async login(email: string, password: string): Promise<TokenResponseDto> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await compare(password, user.password))) {
      await this.auditLogService.log({
        actor: user ? { id: user.id } : null,
        action: AuditAction.LOGIN_FAILED,
        metadata: { email },
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    await this.auditLogService.log({
      actor: { id: user.id },
      action: AuditAction.LOGIN,
    });

    const payload: JwtPayload = {
      sub: user.id,
      name: user.name,
      surname: user.surname,
      admin: user.admin,
      passwordChangedAt: new Date(user.passwordChangedAt).getTime(),
    };

    return { accessToken: this.jwtService.sign(payload) };
  }
}
