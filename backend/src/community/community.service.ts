import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 수정 여부 판단:
 *  - @updatedAt 은 생성 시점에도 createdAt 과 (거의) 동일하게 채워지므로
 *    1초 이상 차이가 날 때만 "수정됨"으로 간주한다.
 *  - 소프트 삭제(deletedAt 세팅)도 update 이므로 updatedAt 이 바뀐다.
 *    삭제된 항목은 호출부에서 edited=false 로 덮어쓴다.
 */
function isEdited(createdAt: Date, updatedAt?: Date | null): boolean {
  if (!updatedAt) return false;
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000;
}

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, tag?: string, cursor?: string) {
    const where = tag && tag !== 'ALL' ? { tag } : {};
    const posts = await (this.prisma as any).post.findMany({
      where,
      take: 20,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, nickname: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId }, select: { id: true } },
      },
    });

    return posts.map((p: any) => this.mapPost(p, p.likes.length > 0));
  }

  async create(userId: string, content: string, tag: string) {
    const post = await (this.prisma as any).post.create({
      data: { content, tag, authorId: userId },
      include: {
        author: { select: { id: true, nickname: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    return this.mapPost(post, false);
  }

  async updatePost(userId: string, postId: string, content: string) {
    const post = await (this.prisma as any).post.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (post.deletedAt)
      throw new ForbiddenException('삭제된 게시글은 수정할 수 없습니다.');
    if (post.authorId !== userId)
      throw new ForbiddenException('본인 게시글만 수정할 수 있습니다.');

    const updated = await (this.prisma as any).post.update({
      where: { id: postId },
      data: { content },
      include: {
        author: { select: { id: true, nickname: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId }, select: { id: true } },
      },
    });
    return this.mapPost(updated, updated.likes.length > 0);
  }

  async deletePost(userId: string, postId: string) {
    const post = await (this.prisma as any).post.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (post.authorId !== userId)
      throw new ForbiddenException('본인 게시글만 삭제할 수 있습니다.');

    const deleted = await (this.prisma as any).post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
    return { id: deleted.id, deleted: true, deletedAt: deleted.deletedAt };
  }

  async toggleLike(userId: string, postId: string) {
    const existing = await (this.prisma as any).postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await (this.prisma as any).postLike.delete({ where: { id: existing.id } });
    } else {
      await (this.prisma as any).postLike.create({ data: { postId, userId } });
    }

    const count = await (this.prisma as any).postLike.count({ where: { postId } });
    return { liked: !existing, count };
  }

  async findComments(postId: string) {
    const comments = await (this.prisma as any).comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, nickname: true } } },
    });
    return comments.map((c: any) => this.mapComment(c));
  }

  async addComment(userId: string, postId: string, content: string) {
    const comment = await (this.prisma as any).comment.create({
      data: { content, postId, authorId: userId },
      include: { author: { select: { id: true, nickname: true } } },
    });
    return this.mapComment(comment);
  }

  async updateComment(
    userId: string,
    postId: string,
    commentId: string,
    content: string,
  ) {
    const comment = await (this.prisma as any).comment.findUnique({
      where: { id: commentId },
    });
    if (!comment || comment.postId !== postId)
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.deletedAt)
      throw new ForbiddenException('삭제된 댓글은 수정할 수 없습니다.');
    if (comment.authorId !== userId)
      throw new ForbiddenException('본인 댓글만 수정할 수 있습니다.');

    const updated = await (this.prisma as any).comment.update({
      where: { id: commentId },
      data: { content },
      include: { author: { select: { id: true, nickname: true } } },
    });
    return this.mapComment(updated);
  }

  async deleteComment(userId: string, postId: string, commentId: string) {
    const comment = await (this.prisma as any).comment.findUnique({
      where: { id: commentId },
    });
    if (!comment || comment.postId !== postId)
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.authorId !== userId)
      throw new ForbiddenException('본인 댓글만 삭제할 수 있습니다.');

    const deleted = await (this.prisma as any).comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
    return { id: deleted.id, deleted: true, deletedAt: deleted.deletedAt };
  }

  // ── 응답 매핑 헬퍼 ─────────────────────────────────────
  private mapPost(p: any, liked: boolean) {
    const deleted = !!p.deletedAt;
    return {
      id: p.id,
      // 삭제된 글은 내용을 숨긴다 (프론트에서 placeholder 렌더)
      content: deleted ? null : p.content,
      tag: p.tag,
      author: p.author,
      likeCount: p._count?.likes ?? 0,
      commentCount: p._count?.comments ?? 0,
      liked,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      deletedAt: p.deletedAt ?? null,
      edited: !deleted && isEdited(p.createdAt, p.updatedAt),
      deleted,
    };
  }

  private mapComment(c: any) {
    const deleted = !!c.deletedAt;
    return {
      id: c.id,
      content: deleted ? null : c.content,
      author: c.author,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt ?? null,
      deletedAt: c.deletedAt ?? null,
      edited: !deleted && isEdited(c.createdAt, c.updatedAt),
      deleted,
    };
  }
}
