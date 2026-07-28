'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [pin, setPin] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'login' | 'pin'>('login');
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const setPinVerified = useAuthStore(s => s.setPinVerified);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/auth/login', { username, password }).then(r => r.data.data);
      setAuth(data.user, data.accessToken, data.refreshToken);
      setStep('pin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-pin', { pin }).then(r => r.data);
      localStorage.setItem('pin_code', pin);
      setPinVerified(true);
      router.push('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'PIN salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-500 via-ocean-600 to-ocean-800 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-ocean-500 flex items-center justify-center text-white text-2xl font-bold mb-3">B</div>
          <CardTitle>BUMDes Admin Login</CardTitle>
          <p className="text-sm text-muted-foreground">Enterprise Grade - Dual Layer Auth (JWT + PIN)</p>
        </CardHeader>
        <CardContent>
          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}
              <Button type="submit" className="w-full bg-ocean-500 hover:bg-ocean-600" disabled={loading}>
                {loading ? 'Loading...' : 'Login (JWT)'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">Default: admin / admin123 | superadmin / admin123</p>
            </form>
          ) : (
            <form onSubmit={handlePin} className="space-y-4">
              <div>
                <label className="text-sm font-medium">PIN Keamanan (Layer 2)</label>
                <Input value={pin} onChange={e => setPin(e.target.value)} placeholder="123456" required />
                <p className="text-xs text-muted-foreground mt-1">PIN dari .env atau admin editable. Default: 123456</p>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
                {loading ? 'Verifikasi...' : 'Verifikasi PIN'}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => setStep('login')}>Kembali</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
