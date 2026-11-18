import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PortalService } from './portal.service';

@ApiTags('portal')
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get public portal data by tenant slug' })
  async getPortal(@Param('slug') slug: string) {
    return this.portalService.getPortalData(slug);
  }

  @Get(':slug/search')
  @ApiOperation({ summary: 'Search bookmarks in a public portal' })
  async searchPortal(
    @Param('slug') slug: string,
    @Query('q') query: string,
  ) {
    return this.portalService.searchPortal(slug, query);
  }

  @Get(':slug/category/:categoryId')
  @ApiOperation({ summary: 'Get bookmarks by category in a public portal' })
  async getByCategory(
    @Param('slug') slug: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.portalService.getByCategory(slug, categoryId);
  }
}
