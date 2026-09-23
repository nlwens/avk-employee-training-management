import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { LocalesService } from './locales.service';
import { Locale } from './entities/locale.entity';
import { LocaleDto } from './dto/locale.dto';

@ApiTags('Locales')
@Serialize(LocaleDto)
@Controller('locales')
export class LocalesController {
  constructor(private readonly localesService: LocalesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all supported locales' })
  @ApiOkResponse({ type: [LocaleDto] })
  findAll(): Promise<Locale[]> {
    return this.localesService.findAll();
  }
}
