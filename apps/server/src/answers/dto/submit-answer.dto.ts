import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { IsInDatabase } from '@/validators/is-in-database.validator';
import { Answer } from '../entities/answer.entity';

export class SubmitAnswerDto {
  @IsUUID()
  @IsInDatabase(Answer, 'id')
  @ApiProperty({ format: 'uuid' })
  answerId: string;
}
