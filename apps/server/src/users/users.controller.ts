import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminOnly } from '@/auth/decorators/admin-only.decorator';
import { Auth } from '@/auth/decorators/auth.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { AuditLog } from '@/audit-log/decorators/audit-log.decorator';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { UsersService } from './users.service';
import { QueryUserParamsDto } from './dto/query-user-params.dto';

@ApiTags('Users')
@Serialize(UserDto)
@AuditLog('users.')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @AdminOnly()
  @ApiOperation({
    summary: 'Get all existing users with optional search parameters',
  })
  @ApiOkResponse({ type: [UserDto] })
  findAll(@Query() searchParams: QueryUserParamsDto): Promise<UserDto[]> {
    return this.usersService.findAll(searchParams);
  }

  @Get(':userId')
  @Auth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiOkResponse({ type: UserDto })
  @ApiForbiddenResponse({ description: 'Access denied' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async findOne(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<UserDto> {
    const user = await this.usersService.findOne(userId);

    if (!currentUser.admin && currentUser.id !== userId) {
      throw new ForbiddenException();
    }

    return user;
  }

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create user' })
  @ApiCreatedResponse({ type: UserDto })
  @ApiConflictResponse({ description: 'Email already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(createUserDto);
  }

  @Patch('@me')
  @Auth()
  @ApiOperation({
    summary: 'Update the current user',
    description: "Updates the authenticated user's profile.",
  })
  @ApiOkResponse({ type: UserDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiForbiddenResponse({ description: 'Current password is incorrect' })
  updateMe(
    @CurrentUser() currentUser: User,
    @Body() updateMeDto: UpdateMeDto,
  ): Promise<UserDto> {
    return this.usersService.updateMe(currentUser, updateMeDto);
  }

  @Patch(':userId')
  @AdminOnly()
  @ApiOperation({ summary: 'Update user' })
  @ApiOkResponse({ type: UserDto })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Email already exists' })
  update(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    return this.usersService.update(userId, updateUserDto);
  }

  @Delete(':userId')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiNoContentResponse({ description: 'User deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async delete(@Param('userId', ParseUUIDPipe) userId: string) {
    const user = await this.usersService.findOne(userId);
    await this.usersService.delete(user.id);
  }
}
