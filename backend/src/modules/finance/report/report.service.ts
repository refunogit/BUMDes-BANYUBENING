import { prisma } from '../../../config/database';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { AppError } from '../../../middlewares/error.middleware';

export const reportService = {
  async labaRugi(startDate?: string, endDate?: string) {
    const whereJournal: any = { status: 'POSTED' };
    if (startDate && endDate) {
      whereJournal.transactionDate = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const entries = await prisma.journalEntry.findMany({
      where: { journal: whereJournal },
      include: { coa: true },
    });

    let totalRevenue = 0;
    let totalExpense = 0;
    const revenueDetails: Record<string, number> = {};
    const expenseDetails: Record<string, number> = {};

    for (const entry of entries) {
      const debit = Number(entry.debit);
      const credit = Number(entry.credit);
      if (entry.coa.type === 'REVENUE') {
        const amount = credit - debit;
        totalRevenue += amount;
        revenueDetails[entry.coa.name] = (revenueDetails[entry.coa.name] || 0) + amount;
      } else if (entry.coa.type === 'EXPENSE') {
        const amount = debit - credit;
        totalExpense += amount;
        expenseDetails[entry.coa.name] = (expenseDetails[entry.coa.name] || 0) + amount;
      }
    }

    const netIncome = totalRevenue - totalExpense;

    return {
      period: { startDate, endDate },
      revenue: { total: totalRevenue, details: revenueDetails },
      expense: { total: totalExpense, details: expenseDetails },
      netIncome,
    };
  },

  async neraca(asOfDate?: string) {
    const whereJournal: any = { status: 'POSTED' };
    if (asOfDate) {
      whereJournal.transactionDate = { lte: new Date(asOfDate) };
    }

    const entries = await prisma.journalEntry.findMany({
      where: { journal: whereJournal },
      include: { coa: true },
    });

    const balanceMap: Record<string, { coa: any; debit: number; credit: number; balance: number }> = {};

    for (const entry of entries) {
      if (!balanceMap[entry.coaId]) {
        balanceMap[entry.coaId] = { coa: entry.coa, debit: 0, credit: 0, balance: 0 };
      }
      balanceMap[entry.coaId].debit += Number(entry.debit);
      balanceMap[entry.coaId].credit += Number(entry.credit);
    }

    // Calculate balance per CoA
    Object.values(balanceMap).forEach(item => {
      if (['ASSET','EXPENSE'].includes(item.coa.type)) {
        item.balance = item.debit - item.credit;
      } else {
        item.balance = item.credit - item.debit;
      }
    });

    let totalAsset = 0, totalLiability = 0, totalEquity = 0;

    Object.values(balanceMap).forEach(item => {
      if (item.coa.type === 'ASSET') totalAsset += item.balance;
      if (item.coa.type === 'LIABILITY') totalLiability += item.balance;
      if (item.coa.type === 'EQUITY') totalEquity += item.balance;
    });

    // Add net income to equity from previous laba rugi calculation
    const labaRugi = await this.labaRugi(undefined, asOfDate);
    totalEquity += labaRugi.netIncome;

    const isBalanced = Math.abs(totalAsset - (totalLiability + totalEquity)) < 0.01;

    return {
      asOfDate: asOfDate || new Date().toISOString(),
      assets: Object.values(balanceMap).filter(b => b.coa.type === 'ASSET'),
      liabilities: Object.values(balanceMap).filter(b => b.coa.type === 'LIABILITY'),
      equity: Object.values(balanceMap).filter(b => b.coa.type === 'EQUITY'),
      summary: { totalAsset, totalLiability, totalEquity, netIncome: labaRugi.netIncome, isBalanced },
    };
  },

  async arusKas(startDate?: string, endDate?: string) {
    const whereJournal: any = { status: 'POSTED' };
    if (startDate && endDate) {
      whereJournal.transactionDate = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const cashCoas = await prisma.coa.findMany({
      where: { type: 'ASSET', name: { contains: 'Kas', mode: 'insensitive' } },
    });

    const cashCoaIds = cashCoas.map(c => c.id);

    // If no cash CoA found, use code like 1-100
    const entries = await prisma.journalEntry.findMany({
      where: {
        journal: whereJournal,
        ...(cashCoaIds.length > 0 ? { coaId: { in: cashCoaIds } } : { coa: { code: { startsWith: '1-1' } } }),
      },
      include: { coa: true, journal: true },
      orderBy: { journal: { transactionDate: 'asc' } },
    });

    let operating = 0, investing = 0, financing = 0;
    const details: any[] = [];

    for (const entry of entries) {
      const amount = Number(entry.debit) - Number(entry.credit);
      // Simple classification based on description or CoA
      const desc = (entry.journal.description + ' ' + (entry.description || '')).toLowerCase();
      let category = 'operating';
      if (desc.includes('investasi') || desc.includes('aset')) category = 'investing';
      else if (desc.includes('modal') || desc.includes('pinjaman')) category = 'financing';

      if (category === 'operating') operating += amount;
      if (category === 'investing') investing += amount;
      if (category === 'financing') financing += amount;

      details.push({
        date: entry.journal.transactionDate,
        description: entry.journal.description,
        amount,
        category,
      });
    }

    const netCashFlow = operating + investing + financing;

    return {
      period: { startDate, endDate },
      operating,
      investing,
      financing,
      netCashFlow,
      details,
    };
  },

  async perubahanModal(startDate?: string, endDate?: string) {
    const neracaStart = await this.neraca(startDate);
    const neracaEnd = await this.neraca(endDate);

    const equityStart = neracaStart.summary.totalEquity;
    const equityEnd = neracaEnd.summary.totalEquity;
    const labaRugi = await this.labaRugi(startDate, endDate);

    return {
      period: { startDate, endDate },
      modalAwal: equityStart,
      labaBersih: labaRugi.netIncome,
      modalAkhir: equityEnd,
      perubahan: equityEnd - equityStart,
      details: {
        equityStartDetails: neracaStart.equity,
        equityEndDetails: neracaEnd.equity,
      },
    };
  },

  async generatePdf(reportType: string, data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text(`BUMDes BANYUBENING`, { align: 'center' });
      doc.fontSize(14).text(`Laporan ${reportType.toUpperCase()}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString('id-ID')}`, { align: 'right' });
      doc.moveDown();

      // Content based on type
      doc.fontSize(12);
      if (reportType === 'laba-rugi') {
        doc.text(`Periode: ${data.period.startDate || 'Awal'} s/d ${data.period.endDate || 'Sekarang'}`);
        doc.moveDown();
        doc.text(`Total Pendapatan: Rp ${data.revenue.total.toLocaleString('id-ID')}`);
        Object.entries(data.revenue.details).forEach(([name, amount]: any) => {
          doc.text(`  - ${name}: Rp ${amount.toLocaleString('id-ID')}`);
        });
        doc.moveDown();
        doc.text(`Total Beban: Rp ${data.expense.total.toLocaleString('id-ID')}`);
        Object.entries(data.expense.details).forEach(([name, amount]: any) => {
          doc.text(`  - ${name}: Rp ${amount.toLocaleString('id-ID')}`);
        });
        doc.moveDown();
        doc.font('Helvetica-Bold').text(`Laba Bersih: Rp ${data.netIncome.toLocaleString('id-ID')}`);
      } else if (reportType === 'neraca') {
        doc.text(`Per tanggal: ${data.asOfDate}`);
        doc.moveDown();
        doc.text(`Total Aset: Rp ${data.summary.totalAsset.toLocaleString('id-ID')}`);
        doc.text(`Total Kewajiban: Rp ${data.summary.totalLiability.toLocaleString('id-ID')}`);
        doc.text(`Total Ekuitas: Rp ${data.summary.totalEquity.toLocaleString('id-ID')}`);
        doc.moveDown();
        doc.text(`Balance Check: ${data.summary.isBalanced ? 'SEIMBANG ✅' : 'TIDAK SEIMBANG ❌'}`);
      } else {
        doc.text(JSON.stringify(data, null, 2));
      }

      doc.moveDown();
      doc.fontSize(8).text('Dokumen ini dihasilkan secara otomatis oleh Sistem Keuangan BUMDes Enterprise - Audit Ready & Immutable', { align: 'center' });

      doc.end();
    });
  },

  async generateExcel(reportType: string, data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(reportType);

    sheet.columns = [
      { header: 'Keterangan', key: 'keterangan', width: 40 },
      { header: 'Jumlah', key: 'jumlah', width: 20 },
      { header: 'Tipe', key: 'tipe', width: 15 },
    ];

    if (reportType === 'laba-rugi') {
      sheet.addRow({ keterangan: `Periode ${data.period.startDate || ''} - ${data.period.endDate || ''}`, jumlah: '', tipe: '' });
      sheet.addRow({ keterangan: 'PENDAPATAN', jumlah: data.revenue.total, tipe: 'REVENUE' });
      Object.entries(data.revenue.details).forEach(([name, amount]: any) => {
        sheet.addRow({ keterangan: name, jumlah: amount, tipe: 'REVENUE' });
      });
      sheet.addRow({ keterangan: 'BEBAN', jumlah: data.expense.total, tipe: 'EXPENSE' });
      Object.entries(data.expense.details).forEach(([name, amount]: any) => {
        sheet.addRow({ keterangan: name, jumlah: amount, tipe: 'EXPENSE' });
      });
      sheet.addRow({ keterangan: 'LABA BERSIH', jumlah: data.netIncome, tipe: 'NET' });
    } else if (reportType === 'neraca') {
      sheet.addRow({ keterangan: `Per tanggal ${data.asOfDate}`, jumlah: '', tipe: '' });
      data.assets.forEach((a: any) => sheet.addRow({ keterangan: `${a.coa.code} - ${a.coa.name}`, jumlah: a.balance, tipe: 'ASSET' }));
      sheet.addRow({ keterangan: 'TOTAL ASET', jumlah: data.summary.totalAsset, tipe: 'TOTAL' });
      data.liabilities.forEach((l: any) => sheet.addRow({ keterangan: `${l.coa.code} - ${l.coa.name}`, jumlah: l.balance, tipe: 'LIABILITY' }));
      sheet.addRow({ keterangan: 'TOTAL KEWAJIBAN', jumlah: data.summary.totalLiability, tipe: 'TOTAL' });
      data.equity.forEach((e: any) => sheet.addRow({ keterangan: `${e.coa.code} - ${e.coa.name}`, jumlah: e.balance, tipe: 'EQUITY' }));
      sheet.addRow({ keterangan: 'TOTAL EKUITAS', jumlah: data.summary.totalEquity, tipe: 'TOTAL' });
    } else {
      sheet.addRow({ keterangan: 'Data JSON', jumlah: JSON.stringify(data).substring(0, 30000), tipe: reportType });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  },

  // For public sanitized charts
  async getPublicFinancialSummary() {
    const [labaRugi, neraca, arusKas] = await Promise.all([
      this.labaRugi(),
      this.neraca(),
      this.arusKas(),
    ]);

    // Sanitized - no detailed CoA, only totals
    return {
      labaRugi: {
        totalRevenue: labaRugi.revenue.total,
        totalExpense: labaRugi.expense.total,
        netIncome: labaRugi.netIncome,
      },
      neraca: {
        totalAsset: neraca.summary.totalAsset,
        totalLiability: neraca.summary.totalLiability,
        totalEquity: neraca.summary.totalEquity,
        isBalanced: neraca.summary.isBalanced,
      },
      arusKas: {
        operating: arusKas.operating,
        investing: arusKas.investing,
        financing: arusKas.financing,
        netCashFlow: arusKas.netCashFlow,
      },
    };
  },
};
