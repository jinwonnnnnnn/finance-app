import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    return posts.map((p: any) => ({
      id: p.id,
      content: p.content,
      tag: p.tag,
      author: p.author,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      liked: p.likes.length > 0,
      createdAt: p.createdAt,
    }));
  }

  async create(userId: string, content: string, tag: string) {
    const post = await (this.prisma as any).post.create({
      data: { content, tag, authorId: userId },
      include: {
        author: { select: { id: true, nickname: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    return {
      id: post.id,
      content: post.content,
      tag: post.tag,
      author: post.author,
      likeCount: 0,
      commentCount: 0,
      liked: false,
      createdAt: post.createdAt,
    };
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
    return (this.prisma as any).comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, nickname: true } } },
    });
  }

  async addComment(userId: string, postId: string, content: string) {
    return (this.prisma as any).comment.create({
      data: { content, postId, authorId: userId },
      include: { author: { select: { id: true, nickname: true } } },
    });
  }
}
