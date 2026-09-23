import { PaginatedResponseDto } from '@/common/dto/paginated-response.dto';
import { CourseDto } from './course.dto';

export class PaginatedCourseDto extends PaginatedResponseDto(CourseDto) {}
