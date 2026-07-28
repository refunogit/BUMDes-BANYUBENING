import { prisma } from '../../../config/database';
import { parsePagination, getSkipTake, paginateResult } from '../../../utils/pagination';
import { createAuditLog } from '../../../lib/audit';
import { AppError } from '../../../middlewares/error.middleware';

function generateJournalNo(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `JRNL-${y}${m}${d}-${rand}`;
}

export const journalService = {
  async list(query: any) {
    const pagination = parsePagination(query);
    const { skip, take } = getSkipTake(pagination);
    const where: any = {};
    if (query.search) {
      where.OR = [
        { journalNo: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { reference: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.startDate && query.endDate) {
      where.transactionDate = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    const [data, total] = await Promise.all([
      prisma.journal.findMany({
        where,
        skip,
        take,
        orderBy: { [pagination.sortBy]: pagination.sortOrder } as any as any,
        include: { entries: { include: { coa: true } }, createdBy: { select: { username: true } } },
      }),
      prisma.journal.count({ where }),
    ]);

    return paginateResult(data, total, pagination);
  },

  async getById(id: string) {
    const journal = await prisma.journal.findUnique({
      where: { id },
      include: { entries: { include: { coa: true } }, createdBy: { select: { username: true } } },
    });
    if (!journal) throw new AppError(404, 'Journal not found');
    return journal;
  },

  async create(data: any, userId?: string, ip?: string, userAgent?: string) {
    // Validate double-entry: total debit must equal total credit
    const entries = data.entries.map((e: any) => ({
      coaId: e.coaId,
      debit: parseFloat(e.debit) || 0,
      credit: parseFloat(e.credit) || 0,
      description: e.description,
    }));

    const totalDebit = entries.reduce((sum: number, e: any) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum: number, e: any) => sum + e.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new AppError(400, `Unbalanced journal: debit ${totalDebit} != credit ${totalCredit}`);
    }

    if (totalDebit === 0) {
      throw new AppError(400, 'Journal entries cannot be zero');
    }

    // Validate CoA existence
    const coaIds = entries.map((e: any) => e.coaId);
    const coas = await prisma.coa.findMany({ where: { id: { in: coaIds } } });
    if (coas.length !== coaIds.length) {
      throw new AppError(400, 'One or more CoA not found');
    }

    const journalNo = generateJournalNo();

    // Transaction-safe operation - ACID compliance
    const journal = await prisma.$transaction(async (tx) => {
      const created = await tx.journal.create({
        data: {
          journalNo,
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
          description: data.description,
          reference: data.reference,
          totalDebit,
          totalCredit,
          createdById: userId,
          status: 'DRAFT',
          entries: {
            create: entries,
          },
        },
        include: { entries: { include: { coa: true } } },
      });
      return created;
    });

    await createAuditLog({ userId, action: 'CREATE', entity: 'Journal', entityId: journal.id, newValue: journal, ipAddress: ip, userAgent });

    return journal;
  },

  async update(id: string, data: any, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.journal.findUnique({ where: { id }, include: { entries: true } });
    if (!existing) throw new AppError(404, 'Journal not found');
    if (existing.status === 'POSTED') throw new AppError(400, 'Cannot edit posted journal - void first');

    let totalDebit = Number(existing.totalDebit);
    let totalCredit = Number(existing.totalCredit);
    let entriesData: any[] | undefined;

    if (data.entries) {
      const entries = data.entries.map((e: any) => ({
        coaId: e.coaId,
        debit: parseFloat(e.debit) || 0,
        credit: parseFloat(e.credit) || 0,
        description: e.description,
      }));
      totalDebit = entries.reduce((sum: number, e: any) => sum + e.debit, 0);
      totalCredit = entries.reduce((sum: number, e: any) => sum + e.credit, 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new AppError(400, `Unbalanced journal: debit ${totalDebit} != credit ${totalCredit}`);
      }
      entriesData = entries;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (entriesData) {
        await tx.journalEntry.deleteMany({ where: { journalId: id } });
      }

      const updatedJournal = await tx.journal.update({
        where: { id },
        data: {
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : undefined,
          description: data.description,
          reference: data.reference,
          status: data.status,
          totalDebit,
          totalCredit,
          ...(entriesData ? { entries: { create: entriesData } } : {}),
          ...(data.status === 'POSTED' ? { postedAt: new Date() } : {}),
        },
        include: { entries: { include: { coa: true } } },
      });

      return updatedJournal;
    });

    await createAuditLog({ userId, action: 'UPDATE', entity: 'Journal', entityId: id, oldValue: existing, newValue: updated, ipAddress: ip, userAgent });

    return updated;
  },

  async postJournal(id: string, status: 'POSTED' | 'VOIDED' | 'DRAFT', userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.journal.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Journal not found');

    const updated = await prisma.journal.update({
      where: { id },
      data: {
        status,
        postedAt: status === 'POSTED' ? new Date() : null,
      },
      include: { entries: { include: { coa: true } } },
    });

    await createAuditLog({ userId, action: `JOURNAL_${status}`, entity: 'Journal', entityId: id, oldValue: existing, newValue: updated, ipAddress: ip, userAgent });

    return updated;
  },

  async delete(id: string, userId?: string, ip?: string, userAgent?: string) {
    const existing = await prisma.journal.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, 'Journal not found');
    if (existing.status === 'POSTED') throw new AppError(400, 'Cannot delete posted journal - void first');

    await prisma.$transaction(async (tx) => {
      await tx.journalEntry.deleteMany({ where: { journalId: id } });
      await tx.journal.delete({ where: { id } });
    });

    await createAuditLog({ userId, action: 'DELETE', entity: 'Journal', entityId: id, oldValue: existing, ipAddress: ip, userAgent });

    return { message: 'Journal deleted' };
  },
};
