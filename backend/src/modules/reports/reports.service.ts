import ExcelJS from 'exceljs';
import { prisma } from '../../shared/prisma/client';
import { logAudit } from '../../shared/logger';

export class ReportsService {
  async generateFinancialExcel(performedBy = 'ADMIN'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BUMDes Banyubening Platform';

    const sheet = workbook.addWorksheet('Laporan Keuangan & Usaha');

    sheet.columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Unit Usaha BUMDes', key: 'unit', width: 25 },
      { header: 'Kategori Pendapatan', key: 'category', width: 25 },
      { header: 'Bulan / Periode', key: 'period', width: 18 },
      { header: 'Realisasi Pendapatan (Rp)', key: 'income', width: 25 },
      { header: 'Status Transparansi', key: 'status', width: 20 },
    ];

    const sampleData = [
      { no: 1, unit: 'Wisata Air Bening Gunung', category: 'Tiket & Wahana', period: 'Juni 2026', income: 45000000, status: 'Terverifikasi' },
      { no: 2, unit: 'Air Minum Dalam Kemasan (AMDK)', category: 'Penjualan Produk Air', period: 'Juni 2026', income: 62500000, status: 'Terverifikasi' },
      { no: 3, unit: 'Agrowisata & Pertanian', category: 'Panen Kopi & Madu', period: 'Juni 2026', income: 20000000, status: 'Terverifikasi' },
      { no: 4, unit: 'Jasa Layanan Desa', category: 'Jasa & Persewaan', period: 'Juni 2026', income: 15000000, status: 'Terverifikasi' },
    ];

    sampleData.forEach((row) => {
      sheet.addRow(row);
    });

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B7A57' }, // Hijau Pedesaan
      };
    });

    logAudit('GENERATE_FINANCIAL_EXCEL', 'Report', null, performedBy, { type: 'FINANCIAL_EXCEL' });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateProgramKerjaExcel(performedBy = 'ADMIN'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Program Kerja BUMDes');

    sheet.columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Judul Program Kerja', key: 'title', width: 35 },
      { header: 'Tanggal Pelaksanaan', key: 'date', width: 20 },
      { header: 'Tim / Pelaksana', key: 'team', width: 25 },
      { header: 'Komentar Aktif', key: 'commentsEnabled', width: 15 },
      { header: 'Jumlah Komentar', key: 'commentCount', width: 18 },
    ];

    const programs = await prisma.programKerja.findMany({
      include: { comments: true },
      orderBy: { createdAt: 'desc' },
    });

    programs.forEach((p, index) => {
      sheet.addRow({
        no: index + 1,
        title: p.title,
        date: p.date,
        team: p.teamName,
        commentsEnabled: p.isCommentEnabled ? 'Aktif' : 'Nonaktif',
        commentCount: p.comments.length,
      });
    });

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B7A57' },
      };
    });

    logAudit('GENERATE_PROGRAM_EXCEL', 'Report', null, performedBy, { type: 'PROGRAM_KERJA_EXCEL' });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generatePengaduanExcel(performedBy = 'ADMIN'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Log Layanan Pengaduan');

    sheet.columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Nomor WhatsApp Warga', key: 'number', width: 20 },
      { header: 'Nama Warga', key: 'name', width: 25 },
      { header: 'Pesan / Pengaduan', key: 'message', width: 45 },
      { header: 'Arah Pesan', key: 'direction', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Waktu', key: 'timestamp', width: 25 },
    ];

    const messages = await prisma.pengaduanMessage.findMany({
      orderBy: { timestamp: 'desc' },
    });

    messages.forEach((msg, idx) => {
      sheet.addRow({
        no: idx + 1,
        number: msg.senderNumber,
        name: msg.senderName,
        message: msg.message,
        direction: msg.direction === 'INCOMING' ? 'Masuk (Warga)' : 'Keluar (Admin)',
        status: msg.status,
        timestamp: msg.timestamp.toLocaleString('id-ID'),
      });
    });

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B7A57' },
      };
    });

    logAudit('GENERATE_PENGADUAN_EXCEL', 'Report', null, performedBy, { type: 'PENGADUAN_EXCEL' });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateAuditExcel(performedBy = 'ADMIN'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Log Audit Sistem');

    sheet.columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Tindakan (Action)', key: 'action', width: 25 },
      { header: 'Entitas', key: 'entity', width: 20 },
      { header: 'ID Entitas', key: 'entityId', width: 25 },
      { header: 'Pengguna Admin', key: 'performedBy', width: 25 },
      { header: 'Detail Perubahan', key: 'details', width: 45 },
      { header: 'Waktu Audit', key: 'timestamp', width: 25 },
    ];

    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200,
    });

    logs.forEach((l, idx) => {
      sheet.addRow({
        no: idx + 1,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId || '-',
        performedBy: l.performedBy,
        details: l.details,
        timestamp: l.timestamp.toLocaleString('id-ID'),
      });
    });

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B7A57' },
      };
    });

    logAudit('GENERATE_AUDIT_EXCEL', 'Report', null, performedBy, { type: 'AUDIT_EXCEL' });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export const reportsService = new ReportsService();
