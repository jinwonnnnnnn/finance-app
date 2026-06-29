import { Controller, Get, Param, Query } from '@nestjs/common';
import { GlossaryService } from './glossary.service';

@Controller('glossary')
export class GlossaryController {
  constructor(private glossaryService: GlossaryService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.glossaryService.findAll(category);
  }

  @Get('categories')
  getCategories() {
    return this.glossaryService.getCategories();
  }

  @Get(':term')
  findOne(@Param('term') term: string) {
    return this.glossaryService.findOne(term);
  }
}
