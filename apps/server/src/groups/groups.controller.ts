import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { AdminOnly } from '@/auth/decorators/admin-only.decorator';
import { AuditLog } from '@/audit-log/decorators/audit-log.decorator';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupDto } from './dto/group.dto';

@ApiTags('Groups')
@Serialize(GroupDto)
@AuditLog('groups.')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupService: GroupsService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a new group' })
  @ApiCreatedResponse({ type: GroupDto })
  create(@Body() body: CreateGroupDto): Promise<GroupDto> {
    return this.groupService.createGroup(body);
  }

  @Get()
  @AdminOnly()
  @ApiOperation({ summary: 'Get all groups' })
  @ApiOkResponse({ type: [GroupDto] })
  getAllGroups(): Promise<GroupDto[]> {
    return this.groupService.getAllGroups();
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Update an existing group' })
  @ApiOkResponse({ type: GroupDto })
  @ApiNotFoundResponse({ description: 'Group not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateGroupDto,
  ): Promise<GroupDto> {
    const group = await this.groupService.findOne(id);
    return this.groupService.update(group, body);
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a group' })
  @ApiNoContentResponse({ description: 'Group deleted successfully' })
  @ApiBadRequestResponse({
    description: 'Group has users or courses assigned to it',
  })
  @ApiNotFoundResponse({ description: 'Group not found' })
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.groupService.delete(id);
  }
}
