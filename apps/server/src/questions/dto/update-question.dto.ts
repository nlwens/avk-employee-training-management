import { IsOptional, IsUUID } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsInDatabase } from '@/validators/is-in-database.validator';
import { Answer } from '@/answers/entities/answer.entity';
import { CreateQuestionDto } from './create-question.dto';

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {
  @ApiProperty({ type: String, format: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  @IsInDatabase(Answer)
  correctAnswerId?: string;
}
