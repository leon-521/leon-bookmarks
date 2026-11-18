import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('categorize')
  @ApiOperation({ summary: 'AI auto-categorize a bookmark' })
  async categorize(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { url: string; title: string; description?: string },
  ) {
    return this.aiService.categorize(tenantId, body.url, body.title, body.description);
  }

  @Post('tags')
  @ApiOperation({ summary: 'AI auto-generate tags for a bookmark' })
  async generateTags(
    @Body() body: { url: string; title: string; description?: string },
  ) {
    return this.aiService.generateTags(body.url, body.title, body.description);
  }

  @Post('summarize')
  @ApiOperation({ summary: 'AI generate a summary description' })
  async summarize(
    @Body() body: { url: string; title: string; description?: string },
  ) {
    return this.aiService.summarize(body.url, body.title, body.description);
  }

  @Get('similar/:bookmarkId')
  @ApiOperation({ summary: 'Find similar bookmarks using AI' })
  async findSimilar(
    @CurrentUser('tenantId') tenantId: string,
    @Param('bookmarkId') bookmarkId: string,
    @Query('limit') limit?: string,
  ) {
    return this.aiService.findSimilar(tenantId, bookmarkId, limit ? parseInt(limit) : 5);
  }

  @Post('organize')
  @ApiOperation({ summary: 'Batch auto-organize uncategorized bookmarks' })
  async organize(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { autoApply?: boolean },
  ) {
    return this.aiService.batchOrganize(tenantId, body.autoApply ?? false);
  }

  @Get('duplicates')
  @ApiOperation({ summary: 'Detect duplicate or very similar bookmarks' })
  async detectDuplicates(@CurrentUser('tenantId') tenantId: string) {
    return this.aiService.detectDuplicates(tenantId);
  }

  @Post('ask')
  @ApiOperation({ summary: 'Conversational AI Q&A over workspace bookmarks' })
  async askWorkspace(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { question: string },
  ) {
    return this.aiService.askWorkspace(tenantId, body.question || '');
  }

  @Post('taxonomy/suggest')
  @ApiOperation({ summary: 'AI suggest category taxonomy structure for workspace' })
  async suggestTaxonomy(@CurrentUser('tenantId') tenantId: string) {
    return this.aiService.suggestTaxonomy(tenantId);
  }

  @Post('taxonomy/apply')
  @ApiOperation({ summary: 'Apply AI suggested taxonomy categories and assignments' })
  async applyTaxonomy(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { proposals: { name: string; icon?: string; bookmarkIds?: string[] }[] },
  ) {
    return this.aiService.applyTaxonomy(tenantId, body.proposals || []);
  }

  @Post('health-check')
  @ApiOperation({ summary: 'Batch check bookmark URL health and get AI broken-link suggestions' })
  async healthCheck(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { limit?: number },
  ) {
    return this.aiService.checkLinksHealth(tenantId, body?.limit ?? 25);
  }
}
