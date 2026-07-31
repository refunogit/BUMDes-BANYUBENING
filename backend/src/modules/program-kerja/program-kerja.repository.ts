import { prisma } from '../../shared/prisma/client';
import { ProgramKerja, ProgramKerjaBlock, Comment } from '@prisma/client';

export class ProgramKerjaRepository {
  async findAll(includeComments = false) {
    return prisma.programKerja.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
        comments: includeComments
          ? {
              where: { isApproved: true },
              orderBy: { createdAt: 'asc' },
            }
          : false,
      },
    });
  }

  async findById(id: string, isAdmin = false) {
    return prisma.programKerja.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
        comments: {
          where: isAdmin ? undefined : { isApproved: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async create(data: { title: string; date: string; teamName: string; isCommentEnabled?: boolean; blocks: Array<{ type: string; content: string; orderIndex: number }> }) {
    return prisma.programKerja.create({
      data: {
        title: data.title,
        date: data.date,
        teamName: data.teamName,
        isCommentEnabled: data.isCommentEnabled ?? true,
        blocks: {
          create: data.blocks.map((b, idx) => ({
            type: b.type,
            content: b.content,
            orderIndex: b.orderIndex ?? idx,
          })),
        },
      },
      include: {
        blocks: { orderBy: { orderIndex: 'asc' } },
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      date?: string;
      teamName?: string;
      isCommentEnabled?: boolean;
      blocks?: Array<{ id?: string; type: string; content: string; orderIndex: number }>;
    }
  ) {
    // Transaction safe update: if blocks are provided, delete old blocks and recreate
    return prisma.$transaction(async (tx) => {
      const updated = await tx.programKerja.update({
        where: { id },
        data: {
          title: data.title,
          date: data.date,
          teamName: data.teamName,
          isCommentEnabled: data.isCommentEnabled,
        },
      });

      if (data.blocks) {
        await tx.programKerjaBlock.deleteMany({
          where: { programKerjaId: id },
        });

        for (let i = 0; i < data.blocks.length; i++) {
          const b = data.blocks[i];
          await tx.programKerjaBlock.create({
            data: {
              programKerjaId: id,
              type: b.type,
              content: b.content,
              orderIndex: b.orderIndex ?? i,
            },
          });
        }
      }

      return tx.programKerja.findUnique({
        where: { id },
        include: {
          blocks: { orderBy: { orderIndex: 'asc' } },
        },
      });
    });
  }

  async delete(id: string) {
    return prisma.programKerja.delete({
      where: { id },
    });
  }

  async addComment(data: {
    programKerjaId: string;
    name: string;
    email: string;
    text: string;
    parentId?: string;
  }) {
    return prisma.comment.create({
      data: {
        programKerjaId: data.programKerjaId,
        name: data.name,
        email: data.email,
        text: data.text,
        parentId: data.parentId || null,
        isApproved: true,
      },
    });
  }

  async findCommentsByProgramId(programKerjaId: string, isAdmin = false) {
    return prisma.comment.findMany({
      where: {
        programKerjaId,
        isApproved: isAdmin ? undefined : true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteComment(commentId: string) {
    return prisma.comment.delete({
      where: { id: commentId },
    });
  }
}

export const programKerjaRepository = new ProgramKerjaRepository();
