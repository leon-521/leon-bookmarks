import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MetaScraperService } from './meta-scraper.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsUrl, IsNotEmpty } from 'class-validator';

class ScrapeUrlDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

@ApiTags('meta')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meta')
export class MetaScraperController {
  constructor(private readonly metaScraperService: MetaScraperService) {}

  @Post('scrape')
  @ApiOperation({ summary: 'Scrape metadata from a URL (title, description, favicon, OG image)' })
  async scrape(@Body() dto: ScrapeUrlDto) {
    return this.metaScraperService.scrapeUrl(dto.url);
  }
}
