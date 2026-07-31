import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import { execSync } from 'child_process';
import { app } from '../src/app';
import { prisma } from '../src/shared/prisma/client';

describe('BUMDes Banyubening Enterprise Platform API Tests', () => {
  let accessToken = '';
  let otpSessionToken = '';
  let generatedOtp = '';
  let testProgramId = '';

  beforeAll(async () => {
    try {
      execSync(
        'PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 PRISMA_SCHEMA_ENGINE_BINARY="/home/user/BUMDes-BANYUBENING/backend/prisma/engines/schema-engine" PRISMA_QUERY_ENGINE_LIBRARY="/home/user/BUMDes-BANYUBENING/backend/prisma/engines/libquery_engine.so.node" npx prisma db push --skip-generate',
        { cwd: path.resolve(__dirname, '..'), stdio: 'ignore', env: process.env }
      );
      execSync('npx ts-node prisma/seed.ts', {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'ignore',
        env: process.env,
      });
    } catch (e) {}
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. GET /health should return system status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });

  it('2. POST /gerbang-internal-bumdes/login-email should pass Step 1 of 2FA', async () => {
    const res = await request(app)
      .post('/gerbang-internal-bumdes/login-email')
      .send({
        email: 'admin@bumdesbanyubening.id',
        password: 'BanyuBening2026!',
        turnstileToken: 'demo_turnstile_token',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.step).toBe('OTP_REQUIRED');
    expect(res.body.devOtp).toBeDefined();
    generatedOtp = res.body.devOtp;
  });

  it('3. POST /gerbang-internal-bumdes/verify-otp should pass Step 2 of 2FA and return OTP session token', async () => {
    const res = await request(app)
      .post('/gerbang-internal-bumdes/verify-otp')
      .send({
        email: 'admin@bumdesbanyubening.id',
        otpCode: generatedOtp,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.step).toBe('PIN_REQUIRED');
    expect(res.body.otpSessionToken).toBeDefined();
    otpSessionToken = res.body.otpSessionToken;
  });

  it('4. POST /gerbang-internal-bumdes/verify-pin should pass Step 3 (10-Digit PIN Numpad) and return JWT tokens', async () => {
    const res = await request(app)
      .post('/gerbang-internal-bumdes/verify-pin')
      .send({
        otpSessionToken,
        pin: '1234567890',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.role).toBe('SUPER_ADMIN');
    accessToken = res.body.accessToken;
  });

  it('5. GET /api/identity should return BUMDes Banyubening public identity', async () => {
    const res = await request(app).get('/api/identity');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('BUMDes Banyubening');
  });

  it('6. PUT /api/theme/activate should switch active holiday theme to KEMERDEKAAN', async () => {
    const res = await request(app)
      .put('/api/theme/activate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeCode: 'KEMERDEKAAN' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activeTheme).toBe('KEMERDEKAAN');
    expect(res.body.data.metadata.emojis).toContain('🇮🇩');

    await request(app)
      .put('/api/theme/activate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ themeCode: 'NORMAL' });
  });

  it('7. POST /api/program-kerja and GET /api/program-kerja should create and return program with alternating blocks', async () => {
    // 1. Create program as Admin on empty database
    const createRes = await request(app)
      .post('/api/program-kerja')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Pengembangan Jaringan Air Bersih Desa & Pengamanan Mata Air Gunung',
        date: '28 Juli 2026',
        teamName: 'Tim Pengelola Air Bening Gunung & Jasa Lingkungan',
        isCommentEnabled: true,
        blocks: [
          {
            type: 'text',
            content:
              'Mata air bening pegunungan di Desa Banyubening merupakan anugerah alam yang tak ternilai bagi kehidupan masyarakat.',
            orderIndex: 0,
          },
          { type: 'image', content: '/images/program-air-1.svg', orderIndex: 1 },
        ],
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);

    // 2. Query list
    const res = await request(app).get('/api/program-kerja');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    testProgramId = res.body.data[0].id;
  });

  it('8. POST /api/program-kerja/:id/comments should add an Instagram-style comment and protect email privacy', async () => {
    const commentRes = await request(app)
      .post(`/api/program-kerja/${testProgramId}/comments`)
      .send({
        name: 'Warga Tester',
        email: 'warga.test@banyubening.id',
        text: 'Program air bersih desa sangat bermanfaat! ❤️ 👍',
      });

    expect(commentRes.status).toBe(201);
    expect(commentRes.body.success).toBe(true);

    const publicRes = await request(app).get(`/api/program-kerja/${testProgramId}`);
    expect(publicRes.status).toBe(200);
    const comments = publicRes.body.data.comments;
    const testComment = comments.find((c: any) => c.name === 'Warga Tester');
    expect(testComment).toBeDefined();
    expect(testComment.email).toBeUndefined();

    const adminRes = await request(app)
      .get(`/api/program-kerja/${testProgramId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(adminRes.status).toBe(200);
    const adminComment = adminRes.body.data.find((c: any) => c.name === 'Warga Tester');
    expect(adminComment.email).toBe('warga.test@banyubening.id');
  });

  it('9. POST /api/pengaduan/webhook should process incoming Fonnte WhatsApp chat and Bot commands (#info)', async () => {
    // 1. Test standard message
    const resMsg = await request(app)
      .post('/api/pengaduan/webhook')
      .send({
        sender: '081234567899',
        name: 'Pak Budi Warga 3',
        message: 'Lapor admin BUMDes, saluran air di jalan desa tersumbat daun kering.',
      });
    expect(resMsg.status).toBe(200);
    expect(resMsg.body.success).toBe(true);
    expect(resMsg.body.data.senderNumber).toBe('081234567899');

    // 2. Test WhatsApp Bot Command (#info)
    const resCmd = await request(app)
      .post('/api/pengaduan/webhook')
      .send({
        sender: '081234567899',
        name: 'Pak Budi Warga 3',
        message: '#info',
      });
    expect(resCmd.status).toBe(200);
    expect(resCmd.body.success).toBe(true);
    expect(resCmd.body.data.command).toBe('#info');
  });

  it('10. GET /api/pengaduan/conversations should return split layout conversation list for Admin', async () => {
    const res = await request(app)
      .get('/api/pengaduan/conversations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('11. GET /api/reports/financial/excel should return an Excel spreadsheet report', async () => {
    const res = await request(app)
      .get('/api/reports/financial/excel')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('spreadsheetml.sheet');
  });

  it('12. POST /api/backup/manual should trigger manual disaster recovery backup archive', async () => {
    const res = await request(app)
      .post('/api/backup/manual')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.filename).toBeDefined();
  });

  it('13. GET /api/audit should return immutable audit logs tracking administrative actions', async () => {
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('14. GET /api/search should return unified search results for Articles, Products, and Program Kerja', async () => {
    const res = await request(app).get('/api/search?q=air');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('articles');
    expect(res.body.data).toHaveProperty('products');
    expect(res.body.data).toHaveProperty('programKerja');
  });

  it('15. POST /api/pengaduan/chat and GET /api/pengaduan/chat/:number should process WhatsApp Shell chat widget and return Bot reply (#produk)', async () => {
    const chatRes = await request(app)
      .post('/api/pengaduan/chat')
      .send({
        senderNumber: '081234567888',
        senderName: 'Warga WhatsApp Shell',
        message: '#produk',
      });
    expect(chatRes.status).toBe(200);
    expect(chatRes.body.success).toBe(true);
    expect(chatRes.body.isBotReply).toBe(true);
    expect(chatRes.body.botReply).toBeDefined();

    const histRes = await request(app).get('/api/pengaduan/chat/081234567888');
    expect(histRes.status).toBe(200);
    expect(histRes.body.success).toBe(true);
    expect(Array.isArray(histRes.body.data)).toBe(true);
    expect(histRes.body.data.length).toBeGreaterThanOrEqual(2);
  });
});
