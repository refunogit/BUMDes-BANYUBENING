import { programKerjaRepository } from './program-kerja.repository';
import { emitContentUpdate } from '../../shared/socket';
import { logAudit } from '../../shared/logger';

export class ProgramKerjaService {
  async getProgramKerjaList(isAdmin = false) {
    const list = await programKerjaRepository.findAll(true);
    return list.map((item) => {
      const { comments, ...rest } = item;
      return {
        ...rest,
        commentCount: comments ? comments.length : 0,
      };
    });
  }

  async getProgramKerjaById(id: string, isAdmin = false) {
    const item = await programKerjaRepository.findById(id, isAdmin);
    if (!item) {
      throw new Error('Program kerja tidak ditemukan.');
    }

    // Build threaded comments hierarchy for frontend
    const comments = item.comments || [];
    const sanitizedComments = comments.map((c) => ({
      id: c.id,
      programKerjaId: c.programKerjaId,
      name: c.name,
      email: isAdmin ? c.email : undefined, // Privacy protection: email only visible to admin
      text: c.text,
      createdAt: c.createdAt,
      parentId: c.parentId,
    }));

    return {
      ...item,
      comments: sanitizedComments,
    };
  }

  async createProgramKerja(data: any, performedBy = 'ADMIN') {
    if (!data.blocks || !Array.isArray(data.blocks) || data.blocks.length === 0) {
      throw new Error('Program kerja minimal harus memiliki 1 blok konten teks atau gambar.');
    }

    const created = await programKerjaRepository.create(data);
    logAudit('CREATE_PROGRAM_KERJA', 'ProgramKerja', created.id, performedBy, { title: created.title });
    emitContentUpdate('program-kerja', created);
    return created;
  }

  async updateProgramKerja(id: string, data: any, performedBy = 'ADMIN') {
    const updated = await programKerjaRepository.update(id, data);
    if (!updated) {
      throw new Error('Program kerja gagal diperbarui.');
    }
    logAudit('UPDATE_PROGRAM_KERJA', 'ProgramKerja', id, performedBy, { title: updated.title });
    emitContentUpdate('program-kerja', updated);
    return updated;
  }

  async deleteProgramKerja(id: string, performedBy = 'ADMIN') {
    const deleted = await programKerjaRepository.delete(id);
    logAudit('DELETE_PROGRAM_KERJA', 'ProgramKerja', id, performedBy, { title: deleted.title });
    emitContentUpdate('program-kerja', { id, deleted: true });
    return deleted;
  }

  async addComment(id: string, data: { name: string; email: string; text: string; parentId?: string }) {
    const program = await programKerjaRepository.findById(id, false);
    if (!program) {
      throw new Error('Program kerja tidak ditemukan.');
    }
    if (!program.isCommentEnabled) {
      throw new Error('🔒 Kolom komentar untuk program kerja ini telah dinonaktifkan oleh Admin.');
    }

    const comment = await programKerjaRepository.addComment({
      programKerjaId: id,
      name: data.name,
      email: data.email,
      text: data.text,
      parentId: data.parentId,
    });

    emitContentUpdate('program-kerja-comments', { programKerjaId: id, comment });
    return {
      id: comment.id,
      programKerjaId: comment.programKerjaId,
      name: comment.name,
      text: comment.text,
      createdAt: comment.createdAt,
      parentId: comment.parentId,
    };
  }

  async getComments(programKerjaId: string, isAdmin = false) {
    const comments = await programKerjaRepository.findCommentsByProgramId(programKerjaId, isAdmin);
    return comments.map((c) => ({
      id: c.id,
      programKerjaId: c.programKerjaId,
      name: c.name,
      email: isAdmin ? c.email : undefined,
      text: c.text,
      createdAt: c.createdAt,
      parentId: c.parentId,
    }));
  }

  async deleteComment(commentId: string, performedBy = 'ADMIN') {
    const deleted = await programKerjaRepository.deleteComment(commentId);
    logAudit('DELETE_COMMENT', 'Comment', commentId, performedBy, { name: deleted.name });
    emitContentUpdate('program-kerja-comments', { deleted: true, commentId });
    return deleted;
  }
}

export const programKerjaService = new ProgramKerjaService();
