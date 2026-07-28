# WhatsApp Bot

## Setup Provider
Edit .env atau Admin -> WhatsApp:
- WHATSAPP_API_URL: endpoint provider
- WHATSAPP_API_KEY: token

Provider kompatibel: Wablas, Fonnte, Whacenter, Twilio (adaptasi fetch di whatsapp.service.ts).

## Queue
- Redis list `whatsapp:send` atau in-memory fallback
- Worker tiap 5 detik proses job
- Retry 3x, status FAILED jika gagal terus

## Command Handler
Implementasi di simulateIncomingMessage. Webhook POST /api/v1/whatsapp/webhook { from, message }

Perintah: /help /info /produk /artikel /pengurus /keuangan
