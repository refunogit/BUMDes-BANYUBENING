'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ShieldCheck,
  LogOut,
  Palette,
  Briefcase,
  MessageSquare,
  ShoppingBag,
  Users,
  Radio,
  Building2,
  Newspaper,
  FileSpreadsheet,
  Database,
  History,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Send,
  Upload,
  RefreshCw,
  Lock,
  Unlock,
  Download,
  Eye,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';

type DashboardTab =
  | 'IDENTITY_THEMES'
  | 'PROGRAM_KERJA'
  | 'LIVE_CHAT_PENGADUAN'
  | 'KATALOG_PRODUK'
  | 'PENGURUS'
  | 'RUNNING_TEXT'
  | 'UNIT_USAHA'
  | 'ARTICLES'
  | 'REPORTS'
  | 'BACKUP_DRIVE'
  | 'AUDIT_LOGS';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>('IDENTITY_THEMES');
  const [token, setToken] = useState<string>('');
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Identity & Theme State
  const [identity, setIdentity] = useState<any>({});
  const [activeTheme, setActiveTheme] = useState<string>('NORMAL');
  const [availableThemes, setAvailableThemes] = useState<any[]>([]);
  const [themeSchedule, setThemeSchedule] = useState<any>({ isAutoSchedule: true });

  // Program Kerja State
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [programForm, setProgramForm] = useState<any>({
    title: '',
    date: '',
    teamName: '',
    isCommentEnabled: true,
    blocks: [{ type: 'text', content: '', orderIndex: 0 }],
  });
  const [programComments, setProgramComments] = useState<any[]>([]);

  // Live Chat Pengaduan (Split Layout State)
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<string>('');
  const [sendingReply, setSendingReply] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Catalog State
  const [products, setProducts] = useState<any[]>([]);
  const [productForm, setProductForm] = useState<any>({
    name: '',
    category: 'Air Minum',
    price: 0,
    stock: 100,
    description: '',
    coverImage: '',
    galleryImages: [''],
    unitName: 'botol',
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Pengurus (The Floating Leaf) State
  const [pengurus, setPengurus] = useState<any[]>([]);
  const [pengurusForm, setPengurusForm] = useState<any>({
    name: '',
    role: 'Direktur',
    photoUrl: '/images/default-avatar.svg',
    orderIndex: 1,
  });
  const [editingPengurusId, setEditingPengurusId] = useState<string | null>(null);

  // Running Text State
  const [runningTexts, setRunningTexts] = useState<any[]>([]);
  const [runningTextForm, setRunningTextForm] = useState<any>({
    text: '',
    category: 'FINANCIAL',
    isActive: true,
    orderIndex: 1,
  });

  // Unit Usaha & Articles State
  const [units, setUnits] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [articleForm, setArticleForm] = useState<any>({
    title: '',
    summary: '',
    content: '',
    coverImage: '/images/hero-mountain-spring.jpg',
    category: 'Wisata',
    author: 'Tim BUMDes',
  });

  // Backup & Audit State
  const [backups, setBackups] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>({});

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const getHeaders = useCallback(() => {
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  // Auth check & data loader
  const fetchAllAdminData = useCallback(
    async (authToken: string) => {
      try {
        const headers = { Authorization: `Bearer ${authToken}` };

        const [
          idRes,
          themeRes,
          progRes,
          convRes,
          prodRes,
          pengRes,
          rtRes,
          unitRes,
          artRes,
          backupRes,
          auditRes,
          healthRes,
        ] = await Promise.all([
          axios.get(`${apiUrl}/api/identity`),
          axios.get(`${apiUrl}/api/theme/active`),
          axios.get(`${apiUrl}/api/program-kerja`, { headers }),
          axios.get(`${apiUrl}/api/pengaduan/conversations`, { headers }).catch(() => ({ data: { data: [] } })),
          axios.get(`${apiUrl}/api/products`),
          axios.get(`${apiUrl}/api/pengurus`),
          axios.get(`${apiUrl}/api/running-text`),
          axios.get(`${apiUrl}/api/unit-usaha`),
          axios.get(`${apiUrl}/api/articles`),
          axios.get(`${apiUrl}/api/backup/history`, { headers }).catch(() => ({ data: { data: [] } })),
          axios.get(`${apiUrl}/api/audit`, { headers }).catch(() => ({ data: { data: [] } })),
          axios.get(`${apiUrl}/health`).catch(() => ({ data: {} })),
        ]);

        if (idRes?.data?.data) setIdentity(idRes.data.data);
        if (themeRes?.data) {
          setActiveTheme(themeRes.data.data?.activeTheme || 'NORMAL');
          setAvailableThemes(themeRes.data.availableThemes || []);
          setThemeSchedule({ isAutoSchedule: themeRes.data.data?.isAutoSchedule ?? true });
        }
        if (progRes?.data?.data) setPrograms(progRes.data.data);
        if (convRes?.data?.data) setConversations(convRes.data.data);
        if (prodRes?.data?.data) setProducts(prodRes.data.data);
        if (pengRes?.data?.data) setPengurus(pengRes.data.data);
        if (rtRes?.data?.data) setRunningTexts(rtRes.data.data);
        if (unitRes?.data?.data) setUnits(unitRes.data.data);
        if (artRes?.data?.data) setArticles(artRes.data.data);
        if (backupRes?.data?.data) setBackups(backupRes.data.data);
        if (auditRes?.data?.data) setAuditLogs(auditRes.data.data);
        if (healthRes?.data) setSystemHealth(healthRes.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('access_token');
          router.replace('/gerbang-internal-bumdes');
        }
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, router]
  );

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) {
      router.replace('/gerbang-internal-bumdes');
      return;
    }
    setToken(storedToken);

    axios
      .get(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
      .then((res) => {
        setAdminUser(res.data.user);
        fetchAllAdminData(storedToken);
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        router.replace('/gerbang-internal-bumdes');
      });

    // Realtime socket connection
    const socket = io(apiUrl);
    socket.emit('join_admin_room');

    socket.on('new_pengaduan_message', (newMsg: any) => {
      axios
        .get(`${apiUrl}/api/pengaduan/conversations`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
        .then((res) => setConversations(res.data?.data || []));

      if (selectedCitizen && selectedCitizen.senderNumber === newMsg.senderNumber) {
        setChatHistory((prev) => [...prev, newMsg]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [apiUrl, fetchAllAdminData, router, selectedCitizen]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleLogout = async () => {
    try {
      await axios.post(`${apiUrl}/api/auth/logout`);
    } catch (e) {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.replace('/gerbang-internal-bumdes');
  };

  // Helper for Admin image uploading
  const handleFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${apiUrl}/api/upload`, formData, {
      headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  };

  // 1. IDENTITY & THEME ACTIONS
  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`${apiUrl}/api/identity`, identity, { headers: getHeaders() });
      showFeedback('success', 'Identitas BUMDes dan Tampilan latar berhasil disimpan!');
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Gagal menyimpan identitas.');
    }
  };

  const handleActivateTheme = async (themeCode: string) => {
    try {
      await axios.put(`${apiUrl}/api/theme/activate`, { themeCode }, { headers: getHeaders() });
      setActiveTheme(themeCode);
      showFeedback('success', `Tema ${themeCode} berhasil diaktifkan secara real-time!`);
    } catch (err: any) {
      showFeedback('error', 'Gagal mengaktifkan tema.');
    }
  };

  // 2. PROGRAM KERJA ACTIONS
  const handleSelectProgramForComments = async (program: any) => {
    setSelectedProgram(program);
    try {
      const res = await axios.get(`${apiUrl}/api/program-kerja/${program.id}/comments`, {
        headers: getHeaders(),
      });
      setProgramComments(res.data?.data || []);
    } catch (e) {
      setProgramComments([]);
    }
  };

  const handleCreateOrUpdateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedProgram && selectedProgram.id) {
        await axios.put(`${apiUrl}/api/program-kerja/${selectedProgram.id}`, programForm, {
          headers: getHeaders(),
        });
        showFeedback('success', 'Program kerja berhasil diperbarui!');
      } else {
        await axios.post(`${apiUrl}/api/program-kerja`, programForm, { headers: getHeaders() });
        showFeedback('success', 'Program kerja baru berhasil dibuat!');
      }
      setSelectedProgram(null);
      setProgramForm({
        title: '',
        date: '',
        teamName: '',
        isCommentEnabled: true,
        blocks: [{ type: 'text', content: '', orderIndex: 0 }],
      });
      fetchAllAdminData(token);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Gagal menyimpan program kerja.');
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!confirm('Yakin ingin menghapus program kerja ini?')) return;
    try {
      await axios.delete(`${apiUrl}/api/program-kerja/${id}`, { headers: getHeaders() });
      showFeedback('success', 'Program kerja berhasil dihapus.');
      fetchAllAdminData(token);
    } catch (e) {
      showFeedback('error', 'Gagal menghapus program kerja.');
    }
  };

  const handleToggleCommentStatus = async (program: any) => {
    try {
      const newStatus = !program.isCommentEnabled;
      await axios.put(
        `${apiUrl}/api/program-kerja/${program.id}`,
        { isCommentEnabled: newStatus },
        { headers: getHeaders() }
      );
      showFeedback(
        'success',
        `Komentar untuk "${program.title}" telah ${newStatus ? 'diaktifkan' : 'dinonaktifkan (🔒)'}.`
      );
      fetchAllAdminData(token);
    } catch (e) {
      showFeedback('error', 'Gagal mengubah status komentar.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Yakin ingin menghapus komentar warga ini?')) return;
    try {
      await axios.delete(`${apiUrl}/api/program-kerja/comments/${commentId}`, {
        headers: getHeaders(),
      });
      showFeedback('success', 'Komentar berhasil dihapus dari sistem.');
      if (selectedProgram) handleSelectProgramForComments(selectedProgram);
    } catch (e) {
      showFeedback('error', 'Gagal menghapus komentar.');
    }
  };

  // 3. LIVE CHAT PENGADUAN ACTIONS
  const handleSelectCitizenChat = async (citizen: any) => {
    setSelectedCitizen(citizen);
    try {
      const res = await axios.get(`${apiUrl}/api/pengaduan/conversations/${citizen.senderNumber}`, {
        headers: getHeaders(),
      });
      setChatHistory(res.data?.data || []);
      // Refresh list to update unread badge
      const convRes = await axios.get(`${apiUrl}/api/pengaduan/conversations`, {
        headers: getHeaders(),
      });
      setConversations(convRes.data?.data || []);
    } catch (e) {
      setChatHistory([]);
    }
  };

  const handleSendChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCitizen || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await axios.post(
        `${apiUrl}/api/pengaduan/reply`,
        {
          senderNumber: selectedCitizen.senderNumber,
          replyText,
        },
        { headers: getHeaders() }
      );
      setChatHistory((prev) => [...prev, res.data?.data]);
      setReplyText('');
      showFeedback('success', 'Balasan dikirim ke WhatsApp warga via Fonnte Gateway.');
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Gagal mengirim balasan WhatsApp.');
    } finally {
      setSendingReply(false);
    }
  };

  // 4. CATALOG ACTIONS
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        await axios.put(`${apiUrl}/api/products/${editingProductId}`, productForm, {
          headers: getHeaders(),
        });
        showFeedback('success', 'Produk berhasil diperbarui.');
      } else {
        await axios.post(`${apiUrl}/api/products`, productForm, { headers: getHeaders() });
        showFeedback('success', 'Produk baru berhasil ditambahkan.');
      }
      setEditingProductId(null);
      setProductForm({
        name: '',
        category: 'Air Minum',
        price: 0,
        stock: 100,
        description: '',
        coverImage: '',
        galleryImages: [''],
        unitName: 'botol',
      });
      fetchAllAdminData(token);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Gagal menyimpan produk.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      await axios.delete(`${apiUrl}/api/products/${id}`, { headers: getHeaders() });
      showFeedback('success', 'Produk berhasil dihapus.');
      fetchAllAdminData(token);
    } catch (e) {
      showFeedback('error', 'Gagal menghapus produk.');
    }
  };

  // 5. PENGURUS ACTIONS
  const handleSavePengurus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPengurusId) {
        await axios.put(`${apiUrl}/api/pengurus/${editingPengurusId}`, pengurusForm, {
          headers: getHeaders(),
        });
        showFeedback('success', 'Profil pengurus berhasil diperbarui.');
      } else {
        await axios.post(`${apiUrl}/api/pengurus`, pengurusForm, { headers: getHeaders() });
        showFeedback('success', 'Pengurus baru berhasil ditambahkan.');
      }
      setEditingPengurusId(null);
      setPengurusForm({
        name: '',
        role: 'Direktur',
        photoUrl: '/images/default-avatar.svg',
        orderIndex: 1,
      });
      fetchAllAdminData(token);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Gagal menyimpan pengurus.');
    }
  };

  const handleDeletePengurus = async (id: string) => {
    if (!confirm('Yakin ingin menghapus personel ini dari kepengurusan?')) return;
    try {
      await axios.delete(`${apiUrl}/api/pengurus/${id}`, { headers: getHeaders() });
      showFeedback('success', 'Personel berhasil dihapus.');
      fetchAllAdminData(token);
    } catch (e) {
      showFeedback('error', 'Gagal menghapus pengurus.');
    }
  };

  // 6. RUNNING TEXT ACTIONS
  const handleCreateRunningText = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${apiUrl}/api/running-text`, runningTextForm, { headers: getHeaders() });
      showFeedback('success', 'Teks berita berjalan baru berhasil ditambahkan.');
      setRunningTextForm({
        text: '',
        category: 'FINANCIAL',
        isActive: true,
        orderIndex: 1,
      });
      fetchAllAdminData(token);
    } catch (err: any) {
      showFeedback('error', 'Gagal menambah running text.');
    }
  };

  const handleDeleteRunningText = async (id: string) => {
    try {
      await axios.delete(`${apiUrl}/api/running-text/${id}`, { headers: getHeaders() });
      showFeedback('success', 'Teks berjalan berhasil dihapus.');
      fetchAllAdminData(token);
    } catch (e) {
      showFeedback('error', 'Gagal menghapus running text.');
    }
  };

  // 7. BACKUP ACTIONS
  const handleTriggerManualBackup = async () => {
    try {
      showFeedback('success', 'Sedang memproses cadangan database BUMDes...');
      const res = await axios.post(`${apiUrl}/api/backup/manual`, {}, { headers: getHeaders() });
      showFeedback('success', `Cadangan berhasil dibuat: ${res.data?.data?.filename}`);
      fetchAllAdminData(token);
    } catch (err: any) {
      showFeedback('error', 'Gagal membuat cadangan manual.');
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm('Peringatan: memulihkan cadangan akan menggantikan database saat ini. Lanjutkan?'))
      return;
    try {
      const res = await axios.post(`${apiUrl}/api/backup/restore`, { backupId }, { headers: getHeaders() });
      showFeedback('success', res.data?.message || 'Database berhasil dipulihkan.');
      fetchAllAdminData(token);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Gagal memulihkan cadangan.');
    }
  };

  // 8. REPORT PDF GENERATOR
  const handleGeneratePdf = (reportType: 'FINANCIAL' | 'PROGRAM_KERJA' | 'PENGADUAN' | 'AUDIT') => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(59, 122, 87); // Hijau Pedesaan

      let title = 'Laporan Keuangan & Laba Usaha BUMDes';
      let filename = 'Laporan_Keuangan_BUMDes_Banyubening.pdf';
      let head = [['No', 'Unit Usaha', 'Kategori', 'Periode', 'Pendapatan (Rp)', 'Status']];
      let body: any[] = [
        [1, 'Wisata Air Bening', 'Tiket & Wahana', 'Juni 2026', 'Rp 45.000.000', 'Terverifikasi'],
        [2, 'Produksi AMDK Air Bening', 'Penjualan AMDK', 'Juni 2026', 'Rp 62.500.000', 'Terverifikasi'],
        [3, 'Agrowisata & Pertanian', 'Kopi & Madu', 'Juni 2026', 'Rp 20.000.000', 'Terverifikasi'],
        [4, 'Jasa Layanan Desa', 'Jasa & Sewa Alat', 'Juni 2026', 'Rp 15.000.000', 'Terverifikasi'],
      ];

      if (reportType === 'PROGRAM_KERJA') {
        title = 'Laporan Realisasi Program Kerja BUMDes';
        filename = 'Laporan_Program_Kerja_BUMDes_Banyubening.pdf';
        head = [['No', 'Judul Program Kerja', 'Tanggal', 'Tim Pelaksana', 'Komentar', 'Jml Komentar']];
        body = programs.map((p, idx) => [
          idx + 1,
          p.title,
          p.date,
          p.teamName,
          p.isCommentEnabled ? 'Aktif' : 'Nonaktif',
          p.commentCount || 0,
        ]);
      } else if (reportType === 'PENGADUAN') {
        title = 'Laporan Log Layanan Pengaduan WhatsApp';
        filename = 'Laporan_Layanan_Pengaduan_BUMDes_Banyubening.pdf';
        head = [['No', 'WhatsApp', 'Nama Warga', 'Pesan', 'Status']];
        body = conversations.map((c, idx) => [
          idx + 1,
          c.senderNumber,
          c.senderName,
          c.lastMessage?.slice(0, 45) || '-',
          c.unreadCount > 0 ? 'Belum Dibaca' : 'Terjawab',
        ]);
      } else if (reportType === 'AUDIT') {
        title = 'Laporan Log Audit Imutabel Sistem';
        filename = 'Log_Audit_BUMDes_Banyubening.pdf';
        head = [['No', 'Waktu', 'Tindakan', 'Entitas', 'Pengguna Admin']];
        body = auditLogs.slice(0, 50).map((l, idx) => [
          idx + 1,
          new Date(l.timestamp).toLocaleTimeString('id-ID'),
          l.action,
          l.entity,
          l.performedBy,
        ]);
      }

      doc.text(title, 14, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 63, 45);
      doc.text(
        'Desa Banyubening, Bejen, Temanggung | Tanggal Cetak: ' + new Date().toLocaleDateString('id-ID'),
        14,
        28
      );

      autoTable(doc, {
        startY: 35,
        head,
        body,
        headStyles: { fillColor: [59, 122, 87] },
      });

      doc.save(filename);
      showFeedback('success', 'Dokumen PDF resmi berhasil dibuat dan diunduh!');
    } catch (err: any) {
      showFeedback('error', 'Gagal membuat dokumen PDF.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-airBeningGunung text-hijauPedesaanTua font-medium">
        Memuat Sistem Kontrol Internal BUMDes Banyubening...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-airBeningGunung flex flex-col md:flex-row text-hijauPedesaanTua">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-hijauPedesaan/20 flex flex-col shrink-0 shadow-lg">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-hijauPedesaan/15 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-hijauPedesaan/10 flex items-center justify-center p-1 border border-hijauPedesaan/20">
            <img
              src={(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + (identity.logoUrl || '/images/logo-bumdes.svg')}
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <div className="text-sm font-extrabold text-hijauPedesaanTua">BUMDes Banyubening</div>
            <div className="text-[10px] font-semibold text-hijauPedesaan uppercase tracking-wider">
              SuperAdmin Control
            </div>
          </div>
        </div>

        {/* Active Theme & User Badge */}
        <div className="px-5 py-3 bg-airBeningGunung/80 border-b border-hijauPedesaan/15 flex items-center justify-between text-xs">
          <span className="font-semibold text-hijauPedesaanTua/80">Tema Liburan:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-kuningBungaMatahari/30 text-hijauPedesaanTua font-bold">
            {activeTheme}
          </span>
        </div>

        {/* Menu Tabs */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {[
            { id: 'IDENTITY_THEMES', label: 'Identitas & Tema Liburan', icon: Palette },
            { id: 'PROGRAM_KERJA', label: 'Program Kerja & Komentar', icon: Briefcase },
            { id: 'LIVE_CHAT_PENGADUAN', label: 'Live Chat Pengaduan (WA)', icon: MessageSquare },
            { id: 'KATALOG_PRODUK', label: 'Katalog Produk (Shopee UX)', icon: ShoppingBag },
            { id: 'PENGURUS', label: 'Pengurus (The Floating Leaf)', icon: Users },
            { id: 'RUNNING_TEXT', label: 'Running Text (News Ticker)', icon: Radio },
            { id: 'UNIT_USAHA', label: 'Unit Usaha BUMDes', icon: Building2 },
            { id: 'ARTICLES', label: 'Berita & Artikel', icon: Newspaper },
            { id: 'REPORTS', label: 'Laporan PDF & Excel', icon: FileSpreadsheet },
            { id: 'BACKUP_DRIVE', label: 'Backup & Google Drive', icon: Database },
            { id: 'AUDIT_LOGS', label: 'Log Audit & Observabilitas', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-hijauPedesaan text-white shadow-md'
                    : 'text-hijauPedesaanTua/80 hover:bg-hijauPedesaan/10 hover:text-hijauPedesaan'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="p-4 border-t border-hijauPedesaan/15 bg-white space-y-3">
          <div className="flex items-center gap-2 text-xs text-hijauPedesaanTua/70 px-1">
            <ShieldCheck className="w-4 h-4 text-hijauPedesaan" />
            <span className="truncate">{adminUser?.email || 'admin@bumdesbanyubening.id'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-merahJambu/15 text-merahJambu font-bold text-xs hover:bg-merahJambu hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Sesi</span>
          </button>
        </div>
      </aside>

      {/* MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="p-4 sm:p-6 bg-white border-b border-hijauPedesaan/20 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-hijauPedesaanTua">
              {activeTab === 'IDENTITY_THEMES' && 'Identitas BUMDes & Tema Liburan'}
              {activeTab === 'PROGRAM_KERJA' && 'Manajemen Program Kerja & Moderasi Komentar'}
              {activeTab === 'LIVE_CHAT_PENGADUAN' && 'WhatsApp Live Chat Pengaduan (Fonnte Gateway)'}
              {activeTab === 'KATALOG_PRODUK' && 'Katalog Produk (Showcase: Gambar, Nama, Harga, Stok)'}
              {activeTab === 'PENGURUS' && 'Pengurus BUMDes ("The Floating Leaf" Admin)'}
              {activeTab === 'RUNNING_TEXT' && 'Running Text Ticker & Indikator Kategori'}
              {activeTab === 'UNIT_USAHA' && 'Kustomisasi Unit Usaha BUMDes'}
              {activeTab === 'ARTICLES' && 'Berita & Publikasi Desa'}
              {activeTab === 'REPORTS' && 'Sistem Laporan Excel & PDF'}
              {activeTab === 'BACKUP_DRIVE' && 'Backup Database & Disaster Recovery (Google Drive)'}
              {activeTab === 'AUDIT_LOGS' && 'Log Audit Imutabel & Observabilitas Sistem'}
            </h1>
            <p className="text-xs text-hijauPedesaanTua/70">
              Perubahan yang Anda simpan akan disinkronkan ke situs publik secara otomatis (Realtime Socket.IO).
            </p>
          </div>

          <a
            href={process.env.NEXT_PUBLIC_PUBLIC_APP_URL || 'http://localhost:3000'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-hijauPedesaan/15 text-hijauPedesaan font-bold text-xs hover:bg-hijauPedesaan hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Lihat Situs Publik</span>
          </a>
        </header>

        {/* Status Toast Banner */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold border ${
              feedback.type === 'success'
                ? 'bg-hijauPedesaan/15 text-hijauPedesaan border-hijauPedesaan/30'
                : 'bg-merahJambu/15 text-merahJambu border-merahJambu/30'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* TAB 1: IDENTITY & THEME SETTINGS */}
        {activeTab === 'IDENTITY_THEMES' && (
          <div className="p-6 space-y-8 max-w-5xl">
            {/* Identity Form */}
            <form
              onSubmit={handleSaveIdentity}
              className="glass-card p-6 sm:p-8 space-y-6"
            >
              <h3 className="text-lg font-bold text-hijauPedesaanTua border-b border-hijauPedesaan/15 pb-3">
                Informasi Identitas & Visual BUMDes Banyubening
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                    Nama BUMDes *
                  </label>
                  <input
                    type="text"
                    required
                    value={identity.name || ''}
                    onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                    Nama Desa / Wilayah *
                  </label>
                  <input
                    type="text"
                    required
                    value={identity.villageName || ''}
                    onChange={(e) => setIdentity({ ...identity, villageName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                  Deskripsi Singkat BUMDes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={identity.description || ''}
                  onChange={(e) => setIdentity({ ...identity, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                    URL Background Alam Desa (Upload) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={identity.heroBackgroundUrl || ''}
                      onChange={(e) => setIdentity({ ...identity, heroBackgroundUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-xs font-mono"
                    />
                    <label className="cursor-pointer px-3 py-2 rounded-xl bg-hijauPedesaan/15 text-hijauPedesaan font-bold text-xs hover:bg-hijauPedesaan hover:text-white transition-colors flex items-center gap-1">
                      <Upload className="w-4 h-4" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            try {
                              const url = await handleFileUpload(e.target.files[0]);
                              setIdentity((prev: any) => ({ ...prev, heroBackgroundUrl: url }));
                              showFeedback('success', 'Gambar latar berhasil diunggah!');
                            } catch (err) {
                              showFeedback('error', 'Gagal mengunggah gambar.');
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                    URL Logo BUMDes *
                  </label>
                  <input
                    type="text"
                    required
                    value={identity.logoUrl || ''}
                    onChange={(e) => setIdentity({ ...identity, logoUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                    Nomor WhatsApp Layanan / Fonnte *
                  </label>
                  <input
                    type="text"
                    required
                    value={identity.phone || ''}
                    onChange={(e) => setIdentity({ ...identity, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                  URL Embed Google Maps Lokasi BUMDes (https://www.google.com/maps/embed?pb=...)
                </label>
                <input
                  type="text"
                  value={identity.mapsEmbedUrl || ''}
                  onChange={(e) => setIdentity({ ...identity, mapsEmbedUrl: e.target.value })}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                className="px-8 py-3 rounded-2xl bg-hijauPedesaan text-white font-bold text-sm shadow hover:bg-hijauPedesaanTua transition-colors"
              >
                Simpan Perubahan Identitas
              </button>
            </form>

            {/* Holiday Themes Control */}
            <div className="glass-card p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-hijauPedesaanTua border-b border-hijauPedesaan/15 pb-3">
                Pengaturan Tema Liburan Dinamis (No-Code Switching)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableThemes.map((thm) => {
                  const isActive = activeTheme === thm.code;
                  return (
                    <div
                      key={thm.code}
                      onClick={() => handleActivateTheme(thm.code)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        isActive
                          ? 'border-hijauPedesaan bg-hijauPedesaan/10 shadow-md scale-[1.02]'
                          : 'border-hijauPedesaan/20 hover:border-hijauPedesaan/50 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm text-hijauPedesaanTua">
                          {thm.name}
                        </span>
                        {isActive && (
                          <span className="px-2.5 py-0.5 rounded-full bg-hijauPedesaan text-white text-[10px] font-bold">
                            Aktif Sekarang
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 my-2">
                        {thm.emojis.map((em: string, index: number) => (
                          <span key={index} className="text-xl">
                            {em}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-hijauPedesaanTua/80 leading-relaxed">
                        {thm.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROGRAM KERJA & COMMENTS MODERATION */}
        {activeTab === 'PROGRAM_KERJA' && (
          <div className="p-6 space-y-8 max-w-6xl">
            {/* List & Toggle Comments */}
            <div className="bg-white p-6 rounded-3xl border border-hijauPedesaan/20 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-hijauPedesaanTua">
                  Daftar Program Kerja & Kontrol Komentar Admin
                </h3>
                <span className="text-xs text-hijauPedesaanTua/70 font-semibold">
                  Klik &ldquo;🔒 Kolom Komentar&rdquo; untuk menonaktifkan komentar program.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programs.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl bg-airBeningGunung/60 border border-hijauPedesaan/20 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-hijauPedesaan">{p.date}</span>
                        <button
                          onClick={() => handleToggleCommentStatus(p)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
                            p.isCommentEnabled
                              ? 'bg-hijauPedesaan text-white'
                              : 'bg-merahJambu text-white'
                          }`}
                        >
                          {p.isCommentEnabled ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Komentar Aktif</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>🔒 Komentar Nonaktif</span>
                            </>
                          )}
                        </button>
                      </div>

                      <h4 className="text-base font-extrabold text-hijauPedesaanTua mt-2">
                        {p.title}
                      </h4>
                      <div className="text-xs text-hijauPedesaanTua/80 mt-1">
                        Tim: {p.teamName}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-hijauPedesaan/15 text-xs font-bold">
                      <button
                        onClick={() => handleSelectProgramForComments(p)}
                        className="text-hijauPedesaan underline hover:text-hijauPedesaanTua"
                      >
                        Lihat {p.commentCount || 0} Komentar & (Email Warga) &rarr;
                      </button>

                      <button
                        onClick={() => handleDeleteProgram(p.id)}
                        className="text-merahJambu hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comment Moderation Modal / Panel */}
            {selectedProgram && (
              <div className="glass-card p-6 sm:p-8 space-y-4 border-2 border-hijauPedesaan/40">
                <div className="flex items-center justify-between border-b border-hijauPedesaan/15 pb-3">
                  <div>
                    <h4 className="text-base font-extrabold text-hijauPedesaanTua">
                      Moderasi Komentar: {selectedProgram.title}
                    </h4>
                    <p className="text-xs text-hijauPedesaanTua/70">
                      Privasi Warga Terlindungi: Alamat Email HANYA TERLIHAT oleh Anda di sini.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedProgram(null)}
                    className="px-3 py-1.5 rounded-xl bg-hijauPedesaan/15 text-hijauPedesaan font-bold text-xs"
                  >
                    Tutup Moderasi
                  </button>
                </div>

                {programComments.length === 0 ? (
                  <p className="text-sm text-hijauPedesaanTua/70 italic py-4">
                    Belum ada komentar untuk program kerja ini.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {programComments.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl bg-airBeningGunung/70 border border-hijauPedesaan/25 flex items-start justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-hijauPedesaanTua">{c.name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-kuningBungaMatahari/30 text-[11px] font-mono font-bold text-hijauPedesaanTua">
                              {c.email || 'tanpa-email@bumdes.id'}
                            </span>
                          </div>
                          <p className="text-sm text-hijauPedesaanTua/90 mt-1">{c.text}</p>
                          <div className="text-[10px] text-hijauPedesaanTua/60 mt-1">
                            {new Date(c.createdAt).toLocaleString('id-ID')}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="p-2 rounded-xl bg-merahJambu/15 text-merahJambu hover:bg-merahJambu hover:text-white transition-colors shrink-0"
                          title="Hapus Komentar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create Program Kerja Form */}
            <form
              onSubmit={handleCreateOrUpdateProgram}
              className="glass-card p-6 sm:p-8 space-y-6"
            >
              <h3 className="text-lg font-bold text-hijauPedesaanTua border-b border-hijauPedesaan/15 pb-3">
                Buat Program Kerja Baru (Blok Teks & Gambar Alternatif)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                    Judul Program Kerja *
                  </label>
                  <input
                    type="text"
                    required
                    value={programForm.title}
                    onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
                    placeholder="Contoh: Digitalisasi Pasar & Inkubator UMKM"
                    className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                    Tanggal Pelaksanaan *
                  </label>
                  <input
                    type="text"
                    required
                    value={programForm.date}
                    onChange={(e) => setProgramForm({ ...programForm, date: e.target.value })}
                    placeholder="28 Juli 2026"
                    className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                  Tim / Pelaksana Program *
                </label>
                <input
                  type="text"
                  required
                  value={programForm.teamName}
                  onChange={(e) => setProgramForm({ ...programForm, teamName: e.target.value })}
                  placeholder="Tim Air Bening Gunung & Jasa Lingkungan"
                  className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm"
                />
              </div>

              {/* Content Blocks */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-hijauPedesaanTua">
                  Blok Konten (Alternatif Teks dan Gambar) *
                </label>
                {programForm.blocks.map((block: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-airBeningGunung/60 border border-hijauPedesaan/25 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-hijauPedesaan">
                        Blok #{index + 1} &bull; Tipe: {block.type === 'text' ? 'Teks Narasi' : 'Gambar Dokumentasi'}
                      </span>
                      <div className="flex items-center gap-2">
                        <select
                          value={block.type}
                          onChange={(e) => {
                            const newBlocks = [...programForm.blocks];
                            newBlocks[index].type = e.target.value as 'text' | 'image';
                            setProgramForm({ ...programForm, blocks: newBlocks });
                          }}
                          className="px-2 py-1 rounded-lg bg-white border border-hijauPedesaan/30 text-xs font-semibold"
                        >
                          <option value="text">Teks Narasi (Auto-Pagination)</option>
                          <option value="image">Gambar Dokumentasi</option>
                        </select>
                        {programForm.blocks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newBlocks = programForm.blocks.filter((_: any, i: number) => i !== index);
                              setProgramForm({ ...programForm, blocks: newBlocks });
                            }}
                            className="p-1 rounded-lg bg-merahJambu/15 text-merahJambu hover:bg-merahJambu hover:text-white transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {block.type === 'text' ? (
                      <textarea
                        rows={4}
                        required
                        value={block.content}
                        onChange={(e) => {
                          const newBlocks = [...programForm.blocks];
                          newBlocks[index].content = e.target.value;
                          setProgramForm({ ...programForm, blocks: newBlocks });
                        }}
                        placeholder="Tuliskan penjelasan detail program... (Teks panjang akan dipecah otomatis ke halaman 1, 2, 3 di frontend)"
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-hijauPedesaan/30 text-sm"
                      />
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={block.content}
                          onChange={(e) => {
                            const newBlocks = [...programForm.blocks];
                            newBlocks[index].content = e.target.value;
                            setProgramForm({ ...programForm, blocks: newBlocks });
                          }}
                          placeholder="/images/program-air-1.svg atau upload..."
                          className="w-full px-4 py-2 rounded-xl bg-white border border-hijauPedesaan/30 text-xs font-mono"
                        />
                        <label className="cursor-pointer px-3 py-2 rounded-xl bg-hijauPedesaan/15 text-hijauPedesaan font-bold text-xs hover:bg-hijauPedesaan hover:text-white transition-colors flex items-center gap-1">
                          <Upload className="w-4 h-4" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                try {
                                  const url = await handleFileUpload(e.target.files[0]);
                                  const newBlocks = [...programForm.blocks];
                                  newBlocks[index].content = url;
                                  setProgramForm({ ...programForm, blocks: newBlocks });
                                  showFeedback('success', 'Gambar berhasil diunggah!');
                                } catch (err) {
                                  showFeedback('error', 'Gagal mengunggah gambar.');
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const lastType =
                      programForm.blocks[programForm.blocks.length - 1]?.type === 'text' ? 'image' : 'text';
                    setProgramForm({
                      ...programForm,
                      blocks: [
                        ...programForm.blocks,
                        { type: lastType, content: '', orderIndex: programForm.blocks.length },
                      ],
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-hijauPedesaan/15 text-hijauPedesaan font-bold text-xs hover:bg-hijauPedesaan hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Blok Konten Alternatif (+1)</span>
                </button>
              </div>

              <button
                type="submit"
                className="px-8 py-3.5 rounded-2xl bg-hijauPedesaan text-white font-bold text-sm shadow hover:bg-hijauPedesaanTua transition-colors"
              >
                Simpan & Terbitkan Program Kerja
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: LIVE CHAT PENGADUAN (WHATSAPP INBOX - FONNTE INTEGRATION SPLIT LAYOUT) */}
        {activeTab === 'LIVE_CHAT_PENGADUAN' && (
          <div className="p-6 h-[calc(100vh-140px)] flex flex-col">
            <div className="bg-white rounded-3xl border border-hijauPedesaan/20 shadow-sm flex-1 flex overflow-hidden">
              {/* LEFT PANEL: Citizen Conversation List */}
              <div className="w-full sm:w-80 border-r border-hijauPedesaan/20 flex flex-col bg-airBeningGunung/40 shrink-0">
                <div className="p-4 border-b border-hijauPedesaan/15 font-bold text-sm text-hijauPedesaanTua flex items-center justify-between">
                  <span>Kotak Masuk Warga ({conversations.length})</span>
                  <span className="px-2 py-0.5 rounded-full bg-hijauPedesaan text-white text-[10px]">
                    Realtime Fonnte
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-hijauPedesaan/10">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-hijauPedesaanTua/70 italic">
                      Belum ada pesan WhatsApp pengaduan yang masuk.
                    </div>
                  ) : (
                    conversations.map((c: any) => {
                      const isSelected = selectedCitizen?.senderNumber === c.senderNumber;
                      return (
                        <div
                          key={c.senderNumber}
                          onClick={() => handleSelectCitizenChat(c)}
                          className={`p-4 cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                            isSelected ? 'bg-white border-l-4 border-hijauPedesaan shadow-sm' : 'hover:bg-white/70'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-hijauPedesaanTua truncate">
                              {c.senderName}
                            </div>
                            <div className="text-xs font-mono text-hijauPedesaan">{c.senderNumber}</div>
                            <p className="text-xs text-hijauPedesaanTua/80 mt-1 truncate">
                              {c.lastMessage}
                            </p>
                          </div>
                          {c.unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-merahJambu text-white text-[10px] font-bold shrink-0">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT PANEL: Conversation History & Send Reply */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {!selectedCitizen ? (
                  <div className="flex-1 flex items-center justify-center p-8 text-center text-hijauPedesaanTua/70">
                    <div>
                      <MessageSquare className="w-12 h-12 text-hijauPedesaan/40 mx-auto mb-3" />
                      <p className="font-semibold">
                        Pilih salah satu warga dari panel kiri untuk membuka obrolan dan membalas pesan.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-hijauPedesaan/15 bg-airBeningGunung/40 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-base text-hijauPedesaanTua">
                          {selectedCitizen.senderName}
                        </h4>
                        <span className="text-xs font-mono text-hijauPedesaan">
                          WhatsApp: {selectedCitizen.senderNumber}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-hijauPedesaan/15 text-hijauPedesaan text-xs font-bold">
                        Terhubung ke Fonnte Gateway
                      </span>
                    </div>

                    {/* Chat Bubble Interface */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#FAF8F5]">
                      {chatHistory.map((msg: any, idx: number) => {
                        const isIncoming = msg.direction === 'INCOMING';
                        return (
                          <div
                            key={msg.id || idx}
                            className={`flex ${isIncoming ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-md p-4 rounded-2xl shadow-sm text-sm ${
                                isIncoming
                                  ? 'bg-white text-hijauPedesaanTua border border-hijauPedesaan/20 rounded-bl-none'
                                  : 'bg-hijauPedesaan text-white rounded-br-none'
                              }`}
                            >
                              <div className="text-[10px] font-bold opacity-75 mb-1">
                                {isIncoming ? msg.senderName : 'Admin BUMDes Banyubening'}
                              </div>
                              <p className="whitespace-pre-line leading-relaxed">{msg.message}</p>
                              <div className="text-[10px] opacity-60 mt-1 text-right">
                                {new Date(msg.timestamp || Date.now()).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Send Reply Box */}
                    <form
                      onSubmit={handleSendChatReply}
                      className="p-4 border-t border-hijauPedesaan/15 bg-white flex items-center gap-3"
                    >
                      <input
                        type="text"
                        required
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Tuliskan balasan untuk WhatsApp warga ini..."
                        className="flex-1 px-4 py-3 rounded-2xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm focus:outline-none focus:ring-2 focus:ring-hijauPedesaan"
                      />
                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        className="px-6 py-3 rounded-2xl bg-hijauPedesaan text-white font-bold text-sm shadow hover:bg-hijauPedesaanTua transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>{sendingReply ? 'Mengirim...' : 'Kirim WA'}</span>
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: KATALOG PRODUK (SHOPEE-LIKE UX ADMIN) */}
        {activeTab === 'KATALOG_PRODUK' && (
          <div className="p-6 space-y-8 max-w-6xl">
            <div className="glass-card p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-hijauPedesaanTua border-b border-hijauPedesaan/15 pb-3">
                {editingProductId ? 'Edit Data Produk Katalog' : 'Tambah Produk Baru ke Katalog (Gambar, Nama, Harga, Stok)'}
              </h3>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                      Nama Produk *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Air Bening Gunung 600ml"
                      className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                      Kategori *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                      Harga (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                      Stok Tersedia *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                      Satuan Unit *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.unitName}
                      onChange={(e) => setProductForm({ ...productForm, unitName: e.target.value })}
                      placeholder="botol, pouch, kg..."
                      className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                      Gambar Utama Produk *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={productForm.coverImage}
                        onChange={(e) => setProductForm({ ...productForm, coverImage: e.target.value })}
                        placeholder="/images/product-amdk.svg"
                        className="w-full px-3 py-2 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-xs font-mono"
                      />
                      <label className="cursor-pointer px-3 py-2 rounded-xl bg-hijauPedesaan/15 text-hijauPedesaan font-bold text-xs hover:bg-hijauPedesaan hover:text-white transition-colors flex items-center gap-1">
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              try {
                                const url = await handleFileUpload(e.target.files[0]);
                                setProductForm((prev: any) => ({
                                  ...prev,
                                  coverImage: url,
                                  galleryImages: [url, ...(prev.galleryImages || []).slice(1)],
                                }));
                                showFeedback('success', 'Gambar produk berhasil diunggah!');
                              } catch (err) {
                                showFeedback('error', 'Gagal mengunggah gambar.');
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                    Deskripsi Lengkap Produk *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-2xl bg-hijauPedesaan text-white font-bold text-sm shadow hover:bg-hijauPedesaanTua transition-colors"
                  >
                    {editingProductId ? 'Simpan Perubahan Produk' : 'Tambah ke Katalog'}
                  </button>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProductId(null);
                        setProductForm({
                          name: '',
                          category: 'Air Minum',
                          price: 0,
                          stock: 100,
                          description: '',
                          coverImage: '',
                          galleryImages: [''],
                          unitName: 'botol',
                        });
                      }}
                      className="px-6 py-3 rounded-2xl bg-white/80 text-hijauPedesaanTua font-bold text-sm border border-hijauPedesaan/30"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Product List Table */}
            <div className="bg-white p-6 rounded-3xl border border-hijauPedesaan/20 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-hijauPedesaanTua">
                Daftar Produk Katalog ({products.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-airBeningGunung/50 border border-hijauPedesaan/20 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="font-bold text-sm text-hijauPedesaanTua">{p.name}</div>
                      <div className="text-xs font-bold text-hijauPedesaan mt-1">
                        Rp {p.price.toLocaleString('id-ID')} / {p.unitName} &bull; Stok: {p.stock}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-hijauPedesaan/15">
                      <button
                        onClick={() => {
                          setEditingProductId(p.id);
                          setProductForm({
                            name: p.name,
                            category: p.category,
                            price: p.price,
                            stock: p.stock,
                            description: p.description,
                            coverImage: p.coverImage,
                            galleryImages: p.galleryImages || [p.coverImage],
                            unitName: p.unitName,
                          });
                        }}
                        className="px-3 py-1 rounded-xl bg-hijauPedesaan/15 text-hijauPedesaan text-xs font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="px-3 py-1 rounded-xl bg-merahJambu/15 text-merahJambu text-xs font-bold"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PENGURUS ("THE FLOATING LEAF" ADMIN) */}
        {activeTab === 'PENGURUS' && (
          <div className="p-6 space-y-8 max-w-5xl">
            <div className="glass-card p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-hijauPedesaanTua border-b border-hijauPedesaan/15 pb-3">
                {editingPengurusId ? 'Edit Profil Pengurus' : 'Tambah Personnel ke Struktur "The Floating Leaf"'}
              </h3>

              <form onSubmit={handleSavePengurus} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                      Nama Pengurus *
                    </label>
                    <input
                      type="text"
                      required
                      value={pengurusForm.name}
                      onChange={(e) => setPengurusForm({ ...pengurusForm, name: e.target.value })}
                      placeholder="Budi Santoso, S.E."
                      className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                      Jabatan / Role * (+ opsi kustom)
                    </label>
                    <input
                      type="text"
                      required
                      value={pengurusForm.role}
                      onChange={(e) => setPengurusForm({ ...pengurusForm, role: e.target.value })}
                      placeholder="Direktur / Sekretaris 1..."
                      className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                      Foto Profil Circular *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={pengurusForm.photoUrl}
                        onChange={(e) => setPengurusForm({ ...pengurusForm, photoUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-xs font-mono"
                      />
                      <label className="cursor-pointer px-3 py-2 rounded-xl bg-hijauPedesaan/15 text-hijauPedesaan font-bold text-xs hover:bg-hijauPedesaan hover:text-white transition-colors flex items-center gap-1">
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              try {
                                const url = await handleFileUpload(e.target.files[0]);
                                setPengurusForm((prev: any) => ({ ...prev, photoUrl: url }));
                                showFeedback('success', 'Foto pengurus berhasil diunggah!');
                              } catch (err) {
                                showFeedback('error', 'Gagal mengunggah foto.');
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-2xl bg-hijauPedesaan text-white font-bold text-sm shadow hover:bg-hijauPedesaanTua transition-colors"
                  >
                    {editingPengurusId ? 'Simpan Perubahan Personnel' : 'Tambah ke Floating Leaf'}
                  </button>
                  {editingPengurusId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPengurusId(null);
                        setPengurusForm({
                          name: '',
                          role: 'Direktur',
                          photoUrl: '/images/default-avatar.svg',
                          orderIndex: 1,
                        });
                      }}
                      className="px-6 py-3 rounded-2xl bg-white/80 text-hijauPedesaanTua font-bold text-sm border border-hijauPedesaan/30"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-hijauPedesaan/20 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-hijauPedesaanTua">
                Daftar Pengurus Aktif ({pengurus.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {pengurus.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-airBeningGunung/50 border border-hijauPedesaan/20 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.photoUrl || '/images/default-avatar.svg'}
                        alt={p.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div>
                        <div className="font-bold text-sm text-hijauPedesaanTua">{p.name}</div>
                        <div className="text-xs font-semibold text-hijauPedesaan uppercase">
                          {p.role}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          setEditingPengurusId(p.id);
                          setPengurusForm({
                            name: p.name,
                            role: p.role,
                            photoUrl: p.photoUrl,
                            bio: p.bio,
                            orderIndex: p.orderIndex || 1,
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-hijauPedesaan/15 text-hijauPedesaan text-xs font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePengurus(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-merahJambu/15 text-merahJambu text-xs font-bold"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: RUNNING TEXT TICKER ADMIN */}
        {activeTab === 'RUNNING_TEXT' && (
          <div className="p-6 space-y-8 max-w-5xl">
            <div className="glass-card p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-hijauPedesaanTua border-b border-hijauPedesaan/15 pb-3">
                Tambah Berita Running Text Ticker (Kategori & Indikator Emoji)
              </h3>

              <form onSubmit={handleCreateRunningText} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                      Teks Berita / Transparansi *
                    </label>
                    <input
                      type="text"
                      required
                      value={runningTextForm.text}
                      onChange={(e) => setRunningTextForm({ ...runningTextForm, text: e.target.value })}
                      placeholder="🟢 [Transparansi Keuangan] Pendapatan BUMDes bulan Juni meningkat 18.5%..."
                      className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-hijauPedesaanTua mb-1">
                      Kategori Indikator *
                    </label>
                    <select
                      value={runningTextForm.category}
                      onChange={(e) =>
                        setRunningTextForm({ ...runningTextForm, category: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-airBeningGunung/60 border border-hijauPedesaan/30 text-sm font-semibold"
                    >
                      <option value="FINANCIAL">🟢 Hijau (Keuangan / Transparansi)</option>
                      <option value="TRAINING">🟡 Kuning (Pelatihan / Acara Warga)</option>
                      <option value="BUSINESS">🔵 Biru (Wisata / Unit Usaha)</option>
                      <option value="GENERAL">🟢 Umum</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-8 py-3 rounded-2xl bg-hijauPedesaan text-white font-bold text-sm shadow hover:bg-hijauPedesaanTua transition-colors"
                >
                  Tambah Teks Berita
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-hijauPedesaan/20 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-hijauPedesaanTua">
                Daftar Running Text Ticker ({runningTexts.length})
              </h3>
              <div className="space-y-3">
                {runningTexts.map((rt) => (
                  <div
                    key={rt.id}
                    className="p-4 rounded-2xl bg-airBeningGunung/50 border border-hijauPedesaan/20 flex items-center justify-between gap-4"
                  >
                    <div className="text-sm font-medium text-hijauPedesaanTua">{rt.text}</div>
                    <button
                      onClick={() => handleDeleteRunningText(rt.id)}
                      className="p-2 rounded-xl bg-merahJambu/15 text-merahJambu hover:bg-merahJambu hover:text-white transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7 & 8: UNIT USAHA & ARTICLES */}
        {(activeTab === 'UNIT_USAHA' || activeTab === 'ARTICLES') && (
          <div className="p-6 space-y-8 max-w-5xl">
            <div className="glass-card p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-bold text-hijauPedesaanTua">
                {activeTab === 'UNIT_USAHA' ? `Daftar Unit Usaha BUMDes (${units.length})` : `Daftar Berita & Publikasi (${articles.length})`}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(activeTab === 'UNIT_USAHA' ? units : articles).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-airBeningGunung/50 border border-hijauPedesaan/20 space-y-2"
                  >
                    <div className="font-extrabold text-base text-hijauPedesaanTua">
                      {item.name || item.title}
                    </div>
                    <p className="text-xs text-hijauPedesaanTua/80 line-clamp-2">
                      {item.description || item.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: REPORTS (EXCEL & PDF GENERATION) */}
        {activeTab === 'REPORTS' && (
          <div className="p-6 space-y-8 max-w-5xl">
            <div className="glass-card p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-hijauPedesaanTua border-b border-hijauPedesaan/15 pb-3">
                Sistem Pelaporan & Unduh Ekspor (Excel & PDF Print)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-airBeningGunung/60 border border-hijauPedesaan/20 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-bold text-base text-hijauPedesaanTua">
                      Laporan Keuangan & Laba Usaha
                    </h4>
                    <p className="text-xs text-hijauPedesaanTua/80 mt-1">
                      Rekapitulasi realisasi pendapatan 4 unit usaha dan transparansi SHU BUMDes.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={`${apiUrl}/api/reports/financial/excel`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-hijauPedesaan text-white text-xs font-bold shadow hover:bg-hijauPedesaanTua transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Excel (.xlsx)</span>
                    </a>
                    <button
                      onClick={() => handleGeneratePdf('FINANCIAL')}
                      className="px-4 py-2 rounded-xl bg-kuningBungaMatahari/40 text-hijauPedesaanTua text-xs font-bold hover:bg-kuningBungaMatahari transition-colors"
                    >
                      Unduh PDF (.pdf)
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-white text-hijauPedesaan text-xs font-bold border border-hijauPedesaan/30 hover:bg-hijauPedesaan/10 transition-colors"
                    >
                      Cetak PDF
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-airBeningGunung/60 border border-hijauPedesaan/20 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-bold text-base text-hijauPedesaanTua">
                      Laporan Realisasi Program Kerja
                    </h4>
                    <p className="text-xs text-hijauPedesaanTua/80 mt-1">
                      Daftar seluruh program kerja, pelaksana, serta status aktivitas komentar warga.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={`${apiUrl}/api/reports/program-kerja/excel`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-hijauPedesaan text-white text-xs font-bold shadow hover:bg-hijauPedesaanTua transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Excel (.xlsx)</span>
                    </a>
                    <button
                      onClick={() => handleGeneratePdf('PROGRAM_KERJA')}
                      className="px-4 py-2 rounded-xl bg-kuningBungaMatahari/40 text-hijauPedesaanTua text-xs font-bold hover:bg-kuningBungaMatahari transition-colors"
                    >
                      Unduh PDF (.pdf)
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-white text-hijauPedesaan text-xs font-bold border border-hijauPedesaan/30 hover:bg-hijauPedesaan/10 transition-colors"
                    >
                      Cetak PDF
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-airBeningGunung/60 border border-hijauPedesaan/20 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-bold text-base text-hijauPedesaanTua">
                      Laporan Log Layanan Pengaduan
                    </h4>
                    <p className="text-xs text-hijauPedesaanTua/80 mt-1">
                      Catatan seluruh pesan masuk WhatsApp warga dan tanggapan dari tim pengaduan BUMDes.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={`${apiUrl}/api/reports/pengaduan/excel`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-hijauPedesaan text-white text-xs font-bold shadow hover:bg-hijauPedesaanTua transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Excel (.xlsx)</span>
                    </a>
                    <button
                      onClick={() => handleGeneratePdf('PENGADUAN')}
                      className="px-4 py-2 rounded-xl bg-kuningBungaMatahari/40 text-hijauPedesaanTua text-xs font-bold hover:bg-kuningBungaMatahari transition-colors"
                    >
                      Unduh PDF (.pdf)
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-white text-hijauPedesaan text-xs font-bold border border-hijauPedesaan/30 hover:bg-hijauPedesaan/10 transition-colors"
                    >
                      Cetak PDF
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-airBeningGunung/60 border border-hijauPedesaan/20 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-bold text-base text-hijauPedesaanTua">
                      Laporan Log Audit Imutabel
                    </h4>
                    <p className="text-xs text-hijauPedesaanTua/80 mt-1">
                      Catatan jejak aktivitas admin secara transparan untuk verifikasi keamanan enterprise.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={`${apiUrl}/api/reports/audit/excel`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-hijauPedesaan text-white text-xs font-bold shadow hover:bg-hijauPedesaanTua transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Excel (.xlsx)</span>
                    </a>
                    <button
                      onClick={() => handleGeneratePdf('AUDIT')}
                      className="px-4 py-2 rounded-xl bg-kuningBungaMatahari/40 text-hijauPedesaanTua text-xs font-bold hover:bg-kuningBungaMatahari transition-colors"
                    >
                      Unduh PDF (.pdf)
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-white text-hijauPedesaan text-xs font-bold border border-hijauPedesaan/30 hover:bg-hijauPedesaan/10 transition-colors"
                    >
                      Cetak PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: BACKUP & GOOGLE DRIVE (DISASTER RECOVERY) */}
        {activeTab === 'BACKUP_DRIVE' && (
          <div className="p-6 space-y-8 max-w-5xl">
            <div className="glass-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-hijauPedesaan/15 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-hijauPedesaanTua">
                    Backup Database & Disaster Recovery (Google Drive Integration)
                  </h3>
                  <p className="text-xs text-hijauPedesaanTua/70">
                    Cron backup otomatis dijadwalkan setiap pukul 00:00 UTC. Folder ID Google Drive: GOOGLE_DRIVE_FOLDER_ID.
                  </p>
                </div>

                <button
                  onClick={handleTriggerManualBackup}
                  className="px-5 py-2.5 rounded-2xl bg-hijauPedesaan text-white font-bold text-xs shadow hover:bg-hijauPedesaanTua transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Buat Backup Manual Sekarang</span>
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-hijauPedesaan">
                  Riwayat Cadangan Tersedia ({backups.length})
                </h4>

                {backups.length === 0 ? (
                  <p className="text-sm text-hijauPedesaanTua/70 italic py-4">
                    Belum ada riwayat backup database tercatat.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {backups.map((bk: any) => (
                      <div
                        key={bk.id}
                        className="p-4 rounded-2xl bg-airBeningGunung/60 border border-hijauPedesaan/25 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-bold text-sm text-hijauPedesaanTua">
                            {bk.filename}
                          </div>
                          <div className="text-xs text-hijauPedesaanTua/70 mt-0.5">
                            Ukuran: {(bk.fileSize / 1024).toFixed(1)} KB &bull; Waktu: {new Date(bk.createdAt).toLocaleString('id-ID')}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestoreBackup(bk.id)}
                            className="px-3 py-1.5 rounded-xl bg-kuningBungaMatahari/40 text-hijauPedesaanTua font-bold text-xs hover:bg-kuningBungaMatahari transition-colors"
                          >
                            Pulihkan (Restore)
                          </button>
                          <a
                            href={`${apiUrl}/api/backup/download/${bk.filename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-hijauPedesaan/15 text-hijauPedesaan hover:bg-hijauPedesaan hover:text-white transition-colors"
                            title="Unduh Arsip"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: AUDIT LOGS & OBSERVABILITY */}
        {activeTab === 'AUDIT_LOGS' && (
          <div className="p-6 space-y-8 max-w-6xl">
            {/* System Health */}
            <div className="bg-white p-6 rounded-3xl border border-hijauPedesaan/20 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-airBeningGunung/50 border border-hijauPedesaan/15">
                <div className="text-xs font-semibold text-hijauPedesaanTua/70">Status Node API</div>
                <div className="text-lg font-bold text-hijauPedesaan mt-1">
                  {systemHealth.status || 'OK (Active)'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-airBeningGunung/50 border border-hijauPedesaan/15">
                <div className="text-xs font-semibold text-hijauPedesaanTua/70">Uptime Server</div>
                <div className="text-lg font-bold text-hijauPedesaanTua mt-1">
                  {systemHealth.uptime ? `${Math.round(systemHealth.uptime)} detik` : 'Online'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-airBeningGunung/50 border border-hijauPedesaan/15">
                <div className="text-xs font-semibold text-hijauPedesaanTua/70">Database Prisma</div>
                <div className="text-lg font-bold text-hijauPedesaan mt-1">
                  {systemHealth.database || 'Connected'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-airBeningGunung/50 border border-hijauPedesaan/15">
                <div className="text-xs font-semibold text-hijauPedesaanTua/70">Versi Platform</div>
                <div className="text-lg font-bold text-hijauPedesaanTua mt-1">
                  {systemHealth.version || 'v1.0.0'}
                </div>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="glass-card p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-bold text-hijauPedesaanTua">
                Jejak Audit Imutabel ({auditLogs.length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-hijauPedesaan/20 text-hijauPedesaan font-bold">
                      <th className="py-2 px-3">Waktu</th>
                      <th className="py-2 px-3">Tindakan (Action)</th>
                      <th className="py-2 px-3">Entitas</th>
                      <th className="py-2 px-3">Pengguna Admin</th>
                      <th className="py-2 px-3">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hijauPedesaan/10">
                    {auditLogs.map((l: any) => (
                      <tr key={l.id} className="hover:bg-airBeningGunung/30">
                        <td className="py-2.5 px-3 whitespace-nowrap text-hijauPedesaanTua/70 font-mono">
                          {new Date(l.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-hijauPedesaanTua">{l.action}</td>
                        <td className="py-2.5 px-3 text-hijauPedesaan">{l.entity}</td>
                        <td className="py-2.5 px-3 font-mono text-hijauPedesaanTua">{l.performedBy}</td>
                        <td className="py-2.5 px-3 text-hijauPedesaanTua/80 max-w-xs truncate">
                          {l.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
