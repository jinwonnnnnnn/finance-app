import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return req.user;
  }

  @Patch('survey')
  saveSurvey(@Req() req: any, @Body() body: { surveyResult: any; interests: string[] }) {
    return this.usersService.saveSurvey(req.user.id, body.surveyResult, body.interests);
  }
}
