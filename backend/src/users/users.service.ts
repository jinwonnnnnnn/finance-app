import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async saveSurvey(userId: string, surveyResult: any, interests: string[]) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { surveyResult, interests, surveyDone: true },
      select: { id: true, email: true, nickname: true, surveyDone: true, interests: true },
    });
  }
}
