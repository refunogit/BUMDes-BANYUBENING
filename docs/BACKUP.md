# Backup & Restore

## Auto Backup
Cron: BACKUP_CRON env default 0 2 * * * (jam 2 pagi)
- pg_dump jika tersedia
- fallback JSON dump semua tabel penting

## Manual
Admin -> Backup -> Create

## Storage
./backups/backup-*.sql atau .json

## Restore
POST /api/v1/backups/restore { fileName }
- Hanya basename, mencegah path traversal
- Untuk JSON: verifikasi manual disarankan di production
- Untuk SQL: psql DATABASE_URL < file

## Cleanup
DELETE /api/v1/backups/cleanup?keepDays=30
