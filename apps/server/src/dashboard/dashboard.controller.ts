import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '@/auth/decorators/admin-only.decorator';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @AdminOnly()
  @Serialize(DashboardStatsDto)
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Returns employee count, published course count, and group count.',
  })
  @ApiOkResponse({ type: DashboardStatsDto })
  getStats(): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats();
  }
}
