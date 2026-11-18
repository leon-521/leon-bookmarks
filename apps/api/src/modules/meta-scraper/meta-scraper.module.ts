import { Module } from '@nestjs/common';
import { MetaScraperController } from './meta-scraper.controller';
import { MetaScraperService } from './meta-scraper.service';

@Module({
  controllers: [MetaScraperController],
  providers: [MetaScraperService],
  exports: [MetaScraperService],
})
export class MetaScraperModule {}
