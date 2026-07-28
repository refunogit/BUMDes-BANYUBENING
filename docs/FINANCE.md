# Sistem Keuangan Enterprise

## Konsep Double-Entry
Setiap transaksi harus seimbang debit = kredit.

## CoA
- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
- Normal balance: ASSET/EXPENSE = DEBIT, lainnya CREDIT

## Alur
1. Buat CoA
2. Buat Journal DRAFT dengan entries
3. Validasi totalDebit == totalCredit
4. POST journal -> status POSTED, postedAt set, tidak bisa edit
5. Ledger hitung running balance
6. Laporan: Laba Rugi (REVENUE-EXPENSE), Neraca (ASSET vs LIABILITY+EQUITY), Arus Kas, Perubahan Modal

## Audit
Semua perubahan CoA/Journal dicatat di AuditLog immutable.
