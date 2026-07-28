import { prisma } from '../../../config/database';
import { parsePagination, getSkipTake, paginateResult } from '../../../utils/pagination';

export const ledgerService = {
  async getLedger(query: any) {
    const pagination = parsePagination(query);
    const { skip, take } = getSkipTake(pagination);

    const where: any = {};
    if (query.coaId) where.coaId = query.coaId;
    if (query.startDate && query.endDate) {
      where.journal = {
        transactionDate: {
          gte: new Date(query.startDate),
          lte: new Date(query.endDate),
        },
        status: 'POSTED',
      };
    } else {
      where.journal = { status: 'POSTED' };
    }

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        include: { coa: true, journal: true },
      }),
      prisma.journalEntry.count({ where }),
    ]);

    // Calculate running balance
    let runningBalance = 0;
    const withBalance = entries.map(entry => {
      const debit = Number(entry.debit);
      const credit = Number(entry.credit);
      const coaType = entry.coa.type;
      // For ASSET, EXPENSE: debit increases
      // For LIABILITY, EQUITY, REVENUE: credit increases
      if (['ASSET','EXPENSE'].includes(coaType)) {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }
      return { ...entry, runningBalance };
    });

    return {
      ...paginateResult(withBalance, total, pagination),
      summary: {
        totalEntries: total,
        runningBalance,
      },
    };
  },

  async getCoaBalance(coaId: string, startDate?: string, endDate?: string) {
    const where: any = { coaId, journal: { status: 'POSTED' } };
    if (startDate && endDate) {
      where.journal.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      include: { coa: true },
    });

    const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit), 0);
    const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit), 0);

    const coa = await prisma.coa.findUnique({ where: { id: coaId } });
    let balance = 0;
    if (coa) {
      if (['ASSET','EXPENSE'].includes(coa.type)) {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }
    }

    return { coa, totalDebit, totalCredit, balance, entriesCount: entries.length };
  },
};
