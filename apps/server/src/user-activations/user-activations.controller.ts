import {
  Body,
  Controller,
  Get,
  GoneException,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiGoneResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuditLog } from '@/audit-log/decorators/audit-log.decorator';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { ActivateUserDto } from './dto/activate-user.dto';
import { UserActivationDto } from './dto/user-activation.dto';
import { UserActivationsService } from './user-activations.service';

@ApiTags('User Activations')
@Controller('user-activations')
export class UserActivationsController {
  constructor(private readonly activationsService: UserActivationsService) {}

  @Get(':code')
  @Serialize(UserActivationDto)
  @ApiOperation({ summary: 'Get a user activation by code' })
  @ApiOkResponse({ type: UserActivationDto })
  @ApiNotFoundResponse({ description: 'Activation code not found' })
  @ApiGoneResponse({ description: 'Activation code has expired' })
  async findOne(@Param('code') code: string): Promise<UserActivationDto> {
    const activation = await this.activationsService.findOne(code);

    if (activation.expiresAt < new Date()) {
      throw new GoneException();
    }

    return activation;
  }

  @Post(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog('user-activations.activate')
  @ApiOperation({ summary: 'Activate a user account using an activation code' })
  @ApiNoContentResponse({ description: 'Account activated successfully' })
  @ApiBadRequestResponse({ description: 'Password does not meet requirements' })
  @ApiNotFoundResponse({ description: 'Activation code not found' })
  @ApiGoneResponse({ description: 'Activation code has expired' })
  async activate(
    @Param('code') code: string,
    @Body() dto: ActivateUserDto,
  ): Promise<void> {
    const activation = await this.activationsService.findOne(code);

    if (activation.expiresAt < new Date()) {
      throw new GoneException();
    }

    await this.activationsService.activate(activation, dto.password);
  }
}
