import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommunityService } from './community.service';

@Controller('community')
@UseGuards(AuthGuard('jwt'))
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  @Get('posts')
  findAll(
    @Req() req: any,
    @Query('tag') tag?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.communityService.findAll(req.user.id, tag, cursor);
  }

  @Post('posts')
  create(@Req() req: any, @Body() body: { content: string; tag: string }) {
    return this.communityService.create(req.user.id, body.content, body.tag);
  }

  @Patch('posts/:id')
  updatePost(
    @Req() req: any,
    @Param('id') postId: string,
    @Body() body: { content: string },
  ) {
    return this.communityService.updatePost(req.user.id, postId, body.content);
  }

  @Delete('posts/:id')
  deletePost(@Req() req: any, @Param('id') postId: string) {
    return this.communityService.deletePost(req.user.id, postId);
  }

  @Post('posts/:id/like')
  toggleLike(@Req() req: any, @Param('id') postId: string) {
    return this.communityService.toggleLike(req.user.id, postId);
  }

  @Get('posts/:id/comments')
  findComments(@Param('id') postId: string) {
    return this.communityService.findComments(postId);
  }

  @Post('posts/:id/comments')
  addComment(
    @Req() req: any,
    @Param('id') postId: string,
    @Body() body: { content: string },
  ) {
    return this.communityService.addComment(req.user.id, postId, body.content);
  }

  @Patch('posts/:postId/comments/:commentId')
  updateComment(
    @Req() req: any,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() body: { content: string },
  ) {
    return this.communityService.updateComment(
      req.user.id,
      postId,
      commentId,
      body.content,
    );
  }

  @Delete('posts/:postId/comments/:commentId')
  deleteComment(
    @Req() req: any,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.communityService.deleteComment(req.user.id, postId, commentId);
  }
}
