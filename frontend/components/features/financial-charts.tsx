'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0ea5e9', '#22c55e', '#ef4444', '#f97316'];

export function FinancialCharts({ data }: { data?: any }) {
  if (!data) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="animate-pulse"><CardContent className="h-64 bg-gray-100" /></Card>
        <Card className="animate-pulse"><CardContent className="h-64 bg-gray-100" /></Card>
      </div>
    );
  }

  const labaData = [
    { name: 'Pendapatan', value: data.labaRugi?.totalRevenue || 0 },
    { name: 'Beban', value: data.labaRugi?.totalExpense || 0 },
    { name: 'Laba Bersih', value: data.labaRugi?.netIncome || 0 },
  ];

  const neracaData = [
    { name: 'Aset', value: data.neraca?.totalAsset || 0 },
    { name: 'Kewajiban', value: data.neraca?.totalLiability || 0 },
    { name: 'Ekuitas', value: data.neraca?.totalEquity || 0 },
  ];

  const formatRp = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-ocean-100">
        <CardHeader>
          <CardTitle className="text-ocean-800 flex items-center gap-2">📊 Laba Rugi (Disanitasi)</CardTitle>
          <p className="text-xs text-muted-foreground">Ringkasan publik - tanpa detail CoA sensitif</p>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={labaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={11} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: any) => formatRp(v)} />
              <Bar dataKey="value" fill="#0ea5e9" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-leaf-200">
        <CardHeader>
          <CardTitle className="text-ocean-800 flex items-center gap-2">🏦 Neraca (Disanitasi)</CardTitle>
          <p className="text-xs text-muted-foreground">Total aset, kewajiban, ekuitas</p>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={neracaData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                {neracaData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => formatRp(v)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 border-orange-200 bg-gradient-to-br from-white to-orange-50/50">
        <CardHeader>
          <CardTitle className="text-sm">💰 Arus Kas Ringkas</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[120px] p-3 rounded-lg bg-white border">
            <p className="text-xs text-muted-foreground">Operasional</p>
            <p className="font-bold text-ocean-600">{formatRp(data.arusKas?.operating || 0)}</p>
          </div>
          <div className="flex-1 min-w-[120px] p-3 rounded-lg bg-white border">
            <p className="text-xs text-muted-foreground">Investasi</p>
            <p className="font-bold text-leaf-600">{formatRp(data.arusKas?.investing || 0)}</p>
          </div>
          <div className="flex-1 min-w-[120px] p-3 rounded-lg bg-white border">
            <p className="text-xs text-muted-foreground">Pendanaan</p>
            <p className="font-bold text-orange-600">{formatRp(data.arusKas?.financing || 0)}</p>
          </div>
          <div className="flex-1 min-w-[120px] p-3 rounded-lg bg-ocean-500 text-white">
            <p className="text-xs text-ocean-100">Net Cash Flow</p>
            <p className="font-bold">{formatRp(data.arusKas?.netCashFlow || 0)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
