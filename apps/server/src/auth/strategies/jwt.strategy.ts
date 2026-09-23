import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EntityNotFoundError } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { UsersService } from '@/users/users.service';
import { JwtPayload } from '../auth';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User | null> {
    try {
      const user = await this.usersService.findOne(payload.sub);

      const { passwordChangedAt } = payload;

      // Reject tokens issued before the user last changed their password,
      // invalidating any session that predates the change.
      if (new Date(user.passwordChangedAt).getTime() !== passwordChangedAt) {
        return null;
      }

      return user;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        return null;
      }

      throw error;
    }
  }
}
