import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { GroupDto } from '@/groups/dto/group.dto';
import { ExposeToAdmin } from '@/common/decorators/expose-to-admin.decorator';
import { type LocaleCode, SUPPORTED_LOCALES } from '@/locales/locales';

export class UserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ExposeToAdmin()
  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    format: 'email',
  })
  email: string;

  @Exclude()
  password: string;

  @ApiProperty({ description: 'First name of the user', example: 'John' })
  name: string;

  @ApiProperty({ description: 'Last name of the user', example: 'Doe' })
  surname: string;

  @ExposeToAdmin()
  @ApiProperty({ description: 'Is the user an administrator', example: false })
  admin: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @Exclude()
  passwordChangedAt: Date;

  @ApiProperty({ enum: SUPPORTED_LOCALES })
  localeCode: LocaleCode;

  @Type(() => GroupDto)
  @ApiProperty({ type: [GroupDto] })
  groups: GroupDto[];
}
