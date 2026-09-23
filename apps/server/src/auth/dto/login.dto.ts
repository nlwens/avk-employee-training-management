import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', format: 'password' })
  @IsNotEmpty()
  password: string;
}
