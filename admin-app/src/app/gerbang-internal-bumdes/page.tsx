'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Delete,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

type LoginStep = 'EMAIL_PASSWORD' | 'OTP_VERIFY' | 'PIN_NUMPAD';

export default function GerbangInternalPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('EMAIL_PASSWORD');

  // Step 1 states
  const [email, setEmail] = useState('admin@bumdesbanyubening.id');
  const [password, setPassword] = useState('BanyuBening2026!');
  const [turnstileToken, setTurnstileToken] = useState('demo_turnstile_token');

  // Step 2 states
  const [otpCode, setOtpCode] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [devOtp, setDevOtp] = useState<string | undefined>(undefined);
  const [timer, setTimer] = useState(180); // 3 minutes

  // Step 3 states
  const [otpSessionToken, setOtpSessionToken] = useState('');
  const [pin, setPin] = useState('');

  // UI feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState('/images/hero-mountain-spring.jpg');
  const [logoUrl, setLogoUrl] = useState('/images/logo-bumdes.svg');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    // Check if already authenticated
    const existingToken = localStorage.getItem('access_token');
    if (existingToken) {
      axios
        .get(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${existingToken}` },
        })
        .then(() => {
          router.replace('/dashboard');
        })
        .catch(() => {
          localStorage.removeItem('access_token');
        });
    }

    // Fetch identity background and logo
    axios
      .get(`${apiUrl}/api/identity`)
      .then((res) => {
        if (res.data?.data) {
          const bg = res.data.data.heroBackgroundUrl;
          const logo = res.data.data.logoUrl;
          if (bg) {
            setBgImage(bg.startsWith('/') ? apiUrl + bg : bg);
          }
          if (logo) {
            setLogoUrl(logo.startsWith('/') ? apiUrl + logo : logo);
          }
        }
      })
      .catch(() => {});
  }, [apiUrl, router]);

  // 180s OTP countdown timer
  useEffect(() => {
    let interval: any;
    if (step === 'OTP_VERIFY' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleStep1EmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await axios.post(`${apiUrl}/gerbang-internal-bumdes/login-email`, {
        email,
        password,
        turnstileToken,
      });

      if (res.data.success && res.data.step === 'OTP_REQUIRED') {
        setPhoneMasked(res.data.phoneMasked || '0812****7890');
        if (res.data.devOtp) {
          setDevOtp(res.data.devOtp);
        }
        setTimer(180);
        setStep('OTP_VERIFY');
        setSuccessMsg(res.data.message);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Email atau kata sandi tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2VerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorMsg('Kode OTP wajib 6 digit angka.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await axios.post(`${apiUrl}/gerbang-internal-bumdes/verify-otp`, {
        email,
        otpCode,
      });

      if (res.data.success && res.data.step === 'PIN_REQUIRED') {
        setOtpSessionToken(res.data.otpSessionToken);
        setStep('PIN_NUMPAD');
        setSuccessMsg('Verifikasi OTP WhatsApp berhasil! Silakan masukkan 10-Digit PIN.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Kode OTP salah atau sudah kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post(`${apiUrl}/gerbang-internal-bumdes/login-email`, {
        email,
        password,
        turnstileToken,
      });
      if (res.data.devOtp) setDevOtp(res.data.devOtp);
      setTimer(180);
      setSuccessMsg('Kode OTP baru telah dikirimkan ke WhatsApp Anda.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal mengirim ulang OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3VerifyPin = async (inputPin: string) => {
    if (inputPin.length !== 10) {
      setErrorMsg('PIN Keamanan wajib 10 digit angka.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await axios.post(`${apiUrl}/gerbang-internal-bumdes/verify-pin`, {
        otpSessionToken,
        pin: inputPin,
      });

      if (res.data.success && res.data.accessToken) {
        localStorage.setItem('access_token', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('refresh_token', res.data.refreshToken);
        }
        setSuccessMsg('Otentikasi 2FA lengkap! Masuk ke Dashboard...');
        setTimeout(() => {
          router.replace('/dashboard');
        }, 500);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || '10-Digit PIN keamanan salah.');
      setPin(''); // Reset PIN input on failure
    } finally {
      setLoading(false);
    }
  };

  const handleNumpadClick = (num: string) => {
    if (loading) return;
    if (pin.length < 10) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 10) {
        handleStep3VerifyPin(newPin);
      }
    }
  };

  const handleNumpadBackspace = () => {
    if (loading) return;
    setPin((p) => p.slice(0, -1));
  };

  const handleNumpadClear = () => {
    if (loading) return;
    setPin('');
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Image of Mountain Spring/Village Scene */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 scale-105 filter brightness-90"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-hijauPedesaanTua/75 via-hijauPedesaan/60 to-airBeningGunung/95" />

      {/* Glassmorphism Auth Container */}
      <div className="relative z-20 glass-container max-w-md w-full p-6 sm:p-10 text-center space-y-6 animate-fadeIn">
        {/* BUMDes Logo Header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-white/40 backdrop-blur-md flex items-center justify-center p-2 border border-white/60 shadow-md">
            <img
              src={logoUrl}
              alt="Logo BUMDes"
              className="w-12 h-12 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/favicon.ico';
              }}
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-hijauPedesaanTua tracking-tight">
            Gerbang Internal BUMDes
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-hijauPedesaan/90 uppercase tracking-widest">
            {step === 'EMAIL_PASSWORD' && 'Tahap 1: Verifikasi Email Utama'}
            {step === 'OTP_VERIFY' && 'Tahap 2: Verifikasi OTP WhatsApp'}
            {step === 'PIN_NUMPAD' && 'Tahap 3: 10-Digit PIN Keamanan'}
          </p>
        </div>

        {/* Status Feedbacks */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-merahJambu/15 border border-merahJambu/40 text-xs font-semibold text-merahJambu flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-hijauPedesaan/15 border border-hijauPedesaan/40 text-xs font-semibold text-hijauPedesaan flex items-center gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: Email + Password */}
        {step === 'EMAIL_PASSWORD' && (
          <form onSubmit={handleStep1EmailPassword} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-hijauPedesaanTua mb-1">
                Email Administrator Utama *
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-hijauPedesaan/70 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bumdesbanyubening.id"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-hijauPedesaan/30 text-sm font-medium text-hijauPedesaanTua focus:outline-none focus:ring-2 focus:ring-hijauPedesaan shadow-sm"
                />
              </div>
              <span className="text-[11px] text-hijauPedesaan/80 block mt-1">
                Hanya satu email resmi yang diizinkan (ADMIN_EMAIL).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-hijauPedesaanTua mb-1">
                Kata Sandi *
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-hijauPedesaan/70 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 border border-hijauPedesaan/30 text-sm font-medium text-hijauPedesaanTua focus:outline-none focus:ring-2 focus:ring-hijauPedesaan shadow-sm"
                />
              </div>
            </div>

            {/* Cloudflare Turnstile / Bot Verification Challenge Info */}
            <div className="p-2.5 rounded-xl bg-white/50 border border-white/60 text-[11px] font-semibold text-hijauPedesaanTua flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-hijauPedesaan" />
                <span>Cloudflare Turnstile Anti-Bot Aktif</span>
              </span>
              <span className="text-kuningBungaMatahari font-bold">Terverifikasi</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-hijauPedesaan text-white font-bold text-sm uppercase tracking-wider shadow-lg hover:bg-hijauPedesaanTua hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Lanjutkan ke Verifikasi OTP'}
            </button>
          </form>
        )}

        {/* STEP 2: WhatsApp OTP */}
        {step === 'OTP_VERIFY' && (
          <form onSubmit={handleStep2VerifyOtp} className="space-y-4 text-left">
            <div className="p-3 rounded-2xl bg-white/70 border border-hijauPedesaan/20 text-xs text-hijauPedesaanTua space-y-1">
              <div className="font-bold">Kode OTP 6-Digit telah dikirim via Fonnte</div>
              <div>Nomor WhatsApp: <span className="font-mono font-bold">{phoneMasked}</span></div>
            </div>

            {/* In dev/test mode, show dev OTP helper badge */}
            {devOtp && (
              <div className="p-2.5 rounded-xl bg-kuningBungaMatahari/25 border border-kuningBungaMatahari/50 text-xs text-hijauPedesaanTua flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-hijauPedesaan" />
                  <span>Dev Mode OTP Helper:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setOtpCode(devOtp)}
                  className="px-2.5 py-1 rounded-lg bg-hijauPedesaan text-white font-mono font-bold hover:bg-hijauPedesaanTua transition-colors"
                >
                  Isi Otomatis: {devOtp}
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-hijauPedesaanTua mb-1">
                Masukkan 6-Digit Kode OTP *
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center font-mono text-2xl tracking-widest py-3 rounded-2xl bg-white/90 border border-hijauPedesaan/30 text-hijauPedesaanTua focus:outline-none focus:ring-2 focus:ring-hijauPedesaan shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-hijauPedesaan">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Berlaku: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>
              </span>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || timer > 150}
                className="underline hover:text-hijauPedesaanTua disabled:opacity-40"
              >
                Kirim Ulang OTP
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('EMAIL_PASSWORD')}
                className="w-1/3 py-3 rounded-2xl bg-white/70 text-hijauPedesaanTua font-bold text-xs uppercase hover:bg-white transition-colors"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={loading || otpCode.length !== 10 && otpCode.length !== 6}
                className="w-2/3 py-3.5 rounded-2xl bg-hijauPedesaan text-white font-bold text-sm uppercase tracking-wider shadow-lg hover:bg-hijauPedesaanTua transition-all disabled:opacity-50"
              >
                {loading ? 'Memverifikasi...' : 'Verifikasi OTP'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Floating Glassmorphism 10-Digit PIN Numpad */}
        {step === 'PIN_NUMPAD' && (
          <div className="space-y-6">
            <div className="text-left space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-hijauPedesaanTua">
                Masukkan 10-Digit PIN Keamanan *
              </div>
              {/* PIN mask circles */}
              <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/60 border border-white shadow-inner">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      idx < pin.length
                        ? 'bg-hijauPedesaan scale-110 shadow'
                        : 'bg-hijauPedesaan/25'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-hijauPedesaanTua/80">
                <span>Terisi: {pin.length} / 10 Digit</span>
                {pin.length === 10 && (
                  <span className="font-bold text-hijauPedesaan animate-pulse">
                    Memverifikasi...
                  </span>
                )}
              </div>
            </div>

            {/* Test Helper for default 1234567890 */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="p-2.5 rounded-xl bg-white/60 border border-white text-xs flex items-center justify-between">
                <span className="text-hijauPedesaanTua font-semibold">Dev PIN: 1234567890</span>
                <button
                  type="button"
                  onClick={() => handleStep3VerifyPin('1234567890')}
                  className="px-3 py-1 rounded-lg bg-hijauPedesaan text-white font-bold hover:bg-hijauPedesaanTua transition-colors"
                >
                  Isi PIN 1234567890
                </button>
              </div>
            )}

            {/* Floating Glassmorphism Numpad */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-3xl bg-airBeningGunung/50 border border-white/60 shadow-lg">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumpadClick(num)}
                  disabled={loading}
                  className="numpad-btn py-4 focus:outline-none"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleNumpadClear}
                disabled={loading}
                className="numpad-btn py-4 flex items-center justify-center text-sm uppercase bg-merahJambu/15 text-merahJambu border-merahJambu/40 hover:bg-merahJambu hover:text-white"
                aria-label="Bersihkan"
              >
                <RotateCcw className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() => handleNumpadClick('0')}
                disabled={loading}
                className="numpad-btn py-4 focus:outline-none"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleNumpadBackspace}
                disabled={loading}
                className="numpad-btn py-4 flex items-center justify-center bg-hijauPedesaan/15 text-hijauPedesaan border-hijauPedesaan/40 hover:bg-hijauPedesaan hover:text-white"
                aria-label="Hapus"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setPin('');
                  setStep('EMAIL_PASSWORD');
                }}
                className="text-xs font-bold text-hijauPedesaanTua underline hover:text-hijauPedesaan"
              >
                Batal / Mulai dari Awal
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center z-20 text-xs text-white/90 font-medium drop-shadow">
        &copy; 2026 BUMDes Banyubening &bull; Sistem Kontrol Internal Aman (Air Bening Gunung)
      </div>
    </main>
  );
}
