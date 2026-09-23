import { ApiProperty } from '@nestjs/swagger';
import { AnswerSubmissionDto } from './answer-submission.dto';

export class UserAnswerDto extends AnswerSubmissionDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID of the answer submitted by the user',
  })
  answerId: string;

  @ApiProperty({
    format: 'uuid',
    description: 'ID of the user who submitted the answer',
  })
  userId: string;

  @ApiProperty({ description: 'When the answer was submitted' })
  createdAt: Date;
}
