import { CourseDto } from '@/courses/dto/course.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ExposeToAdmin } from '@/common/decorators/expose-to-admin.decorator';
import { GroupDto } from '@/groups/dto/group.dto';

export class CourseDetailDto extends CourseDto {
  @ExposeToAdmin()
  @Type(() => GroupDto)
  @ApiProperty({
    type: [GroupDto],
    description:
      'List of groups that can access the course. Available only to administrators.',
  })
  groups: GroupDto[];
}
