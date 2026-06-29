import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GlossaryService {
  constructor(private prisma: PrismaService) {}

  findAll(category?: string) {
    return this.prisma.glossary.findMany({
      where: category ? { category } : undefined,
      orderBy: { term: 'asc' },
    });
  }

  findOne(term: string) {
    return this.prisma.glossary.findUnique({ where: { term } });
  }

  getCategories() {
    return this.prisma.glossary.findMany({
      distinct: ['category'],
      select: { category: true },
    });
  }
}
