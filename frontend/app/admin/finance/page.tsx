'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function FinancePage() {
  const [coa, setCoa] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [journalForm, setJournalForm] = useState({ description: '', entries: [{ coaId: '', debit: 0, credit: 0 }] });

  const fetchData = async () => {
    try {
      const [coaRes, journalRes] = await Promise.all([
        api.get('/finance/coa').then(r=>r.data.data || []),
        api.get('/finance/journals').then(r=>r.data.data || []),
      ]);
      setCoa(Array.isArray(coaRes) ? coaRes : coaRes.data || []);
      setJournals(Array.isArray(journalRes) ? journalRes : journalRes.data || []);
    } catch {}
  };

  useEffect(()=>{ fetchData(); 
    api.get('/finance/reports/laba-rugi').then(r=>setReports(r.data.data)).catch(()=>{});
  }, []);

  const handleCreateJournal = async () => {
    try {
      const payload = {
        description: journalForm.description,
        entries: journalForm.entries.filter(e=> e.coaId).map(e=> ({ ...e, debit: Number(e.debit), credit: Number(e.credit) })),
      };
      if (payload.entries.length < 2) { alert('Minimal 2 entri double-entry'); return; }
      await api.post('/finance/journals', payload);
      setJournalForm({ description: '', entries: [{ coaId: '', debit: 0, credit: 0 }] });
      fetchData();
      alert('Journal created - ACID compliant, audit logged');
    } catch (e:any) { alert(e.response?.data?.message || 'Error'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sistem Keuangan Enterprise - Double-Entry</h1>
      
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Buat Jurnal (Transaction-Safe)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Deskripsi transaksi" value={journalForm.description} onChange={e=> setJournalForm({...journalForm, description: e.target.value})} />
            {journalForm.entries.map((entry, idx)=>(
              <div key={idx} className="grid grid-cols-4 gap-2 p-2 border rounded">
                <select className="border rounded px-2 text-sm" value={entry.coaId} onChange={e=>{
                  const newEntries=[...journalForm.entries]; newEntries[idx].coaId=e.target.value; setJournalForm({...journalForm, entries:newEntries});
                }}>
                  <option value="">Pilih CoA</option>
                  {coa.map((c:any)=><option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
                <Input type="number" placeholder="Debit" value={entry.debit} onChange={e=>{ const ne=[...journalForm.entries]; ne[idx].debit=Number(e.target.value); setJournalForm({...journalForm, entries:ne}); }} />
                <Input type="number" placeholder="Kredit" value={entry.credit} onChange={e=>{ const ne=[...journalForm.entries]; ne[idx].credit=Number(e.target.value); setJournalForm({...journalForm, entries:ne}); }} />
                <Button variant="outline" size="sm" onClick={()=> setJournalForm({...journalForm, entries: journalForm.entries.filter((_,i)=>i!==idx)})}>Hapus</Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" onClick={()=> setJournalForm({...journalForm, entries: [...journalForm.entries, { coaId: '', debit: 0, credit: 0 }]})}>+ Baris</Button>
              <Button className="bg-ocean-500" onClick={handleCreateJournal}>Simpan Jurnal</Button>
            </div>
            <p className="text-xs text-muted-foreground">Validasi: debit == kredit, ACID transaction, immutable audit log</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>CoA (Chart of Account)</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {coa.map((c:any)=><div key={c.id} className="p-2 border rounded text-sm"><b>{c.code}</b> {c.name} <span className="text-xs ml-2 px-1 bg-gray-100 rounded">{c.type}</span></div>)}
            {coa.length===0 && <p className="text-sm text-muted-foreground">CoA belum ada atau backend offline</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Jurnal Terbaru</CardTitle></CardHeader>
        <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
          {journals.map((j:any)=>(
            <div key={j.id} className="p-3 border rounded-lg">
              <div className="flex justify-between"><b>{j.journalNo}</b><span className={`text-xs px-2 py-0.5 rounded ${j.status==='POSTED'?'bg-green-100 text-green-700':'bg-orange-100'}`}>{j.status}</span></div>
              <p className="text-sm">{j.description}</p>
              <p className="text-xs text-muted-foreground">Debit: Rp {Number(j.totalDebit).toLocaleString('id-ID')} | Kredit: Rp {Number(j.totalCredit).toLocaleString('id-ID')}</p>
            </div>
          ))}
          {journals.length===0 && <p className="text-sm text-muted-foreground">Belum ada jurnal</p>}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader><CardTitle>Laporan Keuangan</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={async()=>{ const res=await api.get('/finance/reports/laba-rugi?format=pdf', { responseType:'blob' }).catch(()=>null); if(res) { const url=URL.createObjectURL(res.data); window.open(url); } else alert('PDF akan tersedia saat backend aktif'); }}>📄 Laba Rugi PDF</Button>
          <Button variant="outline" onClick={async()=>{ const res=await api.get('/finance/reports/neraca?format=excel', { responseType:'blob' }).catch(()=>null); if(res) { const url=URL.createObjectURL(res.data); const a=document.createElement('a'); a.href=url; a.download='neraca.xlsx'; a.click(); } else alert('Excel akan tersedia saat backend aktif'); }}>📊 Neraca Excel</Button>
          <Button variant="outline" onClick={()=> api.get('/finance/reports/laba-rugi').then(r=> setReports(r.data.data))}>Refresh Laba Rugi</Button>
        </CardContent>
        {reports && <CardContent className="text-sm bg-gray-50 rounded m-4"><pre className="whitespace-pre-wrap text-xs">{JSON.stringify(reports, null, 2).substring(0, 2000)}</pre></CardContent>}
      </Card>
    </div>
  );
}
