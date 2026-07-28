'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PengurusPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({});
  const endpoint = '/pengurus';

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoint).then(r=>r.data);
      const data = res.data || res || [];
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(()=>{ fetchItems(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v])=>{ if(v) fd.append(k, v as any); });
      // If no file, send JSON
      const hasFile = Object.values(form).some((v:any)=> v instanceof File);
      if (hasFile) {
        await api.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post(endpoint, form);
      }
      setForm({});
      fetchItems();
    } catch (err: any) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus?')) return;
    try { await api.delete(`${endpoint}/${id}`); fetchItems(); } catch (e:any){ alert('Gagal hapus'); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Pengurus Management</h1><p className="text-sm text-muted-foreground">Full CRUD Control - Enterprise Grade - Audit Logged</p></div>
      
      <Card>
        <CardHeader><CardTitle className="text-base">Tambah Pengurus</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid md:grid-cols-3 gap-3">
            <Input placeholder="name" value={form.name||''} onChange={e=> setForm({...form, name: e.target.value})} />
            <Input placeholder="roleLabel" value={form.roleLabel||''} onChange={e=> setForm({...form, roleLabel: e.target.value})} />
            <Input placeholder="role" value={form.role||''} onChange={e=> setForm({...form, role: e.target.value})} />
            <Button type="submit" className="bg-ocean-500">Create</Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">Semua upload via dashboard ONLY - File handling via storage provider, audit trail otomatis</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Daftar Pengurus ({items.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div>Loading...</div> : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {items.map((it:any)=>(
                <div key={it.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{it.title || it.name || it.text || it.fileName || it.id}</p>
                    <p className="text-xs text-muted-foreground truncate">{it.category || it.roleLabel || it.emoji || it.status || ''} {it.price ? 'Rp '+Number(it.price).toLocaleString('id-ID') : ''}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={()=> handleDelete(it.id)}>Hapus</Button>
                </div>
              ))}
              {items.length===0 && <p className="text-center text-muted-foreground py-8">Belum ada data - Pengurus kosong</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
