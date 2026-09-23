import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalesService } from './locales.service';
import { LocalesController } from './locales.controller';
import { Locale } from './entities/locale.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Locale])],
  controllers: [LocalesController],
  providers: [LocalesService],
  exports: [LocalesService],
})
export class LocalesModule implements OnModuleInit {
  constructor(private readonly localesService: LocalesService) {}

  async onModuleInit(): Promise<void> {
    await this.localesService.initializeLocales();
  }
}
