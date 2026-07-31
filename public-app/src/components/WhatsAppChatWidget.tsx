'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  MessageCircle,
  X,
  Send,
  CheckCheck,
  Bot,
  User,
  Phone,
  Sparkles,
  HelpCircle,
  ShoppingBag,
  Briefcase,
} from 'lucide-react';

export interface WhatsAppWidgetProps {
  name?: string;
  phone?: string;
  logoUrl?: string;
}

export const WhatsAppChatWidget: React.FC<{ identity: WhatsAppWidgetProps }> = ({ identity }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const savedPhone = localStorage.getItem('bumdes_wa_phone');
    const savedName = localStorage.getItem('bumdes_wa_name');
    if (savedPhone) {
      setCitizenPhone(savedPhone);
      if (savedName) setCitizenName(savedName);
      setIsRegistered(true);
      fetchChatHistory(savedPhone);
    }
  }, []);

  const fetchChatHistory = async (phone: string) => {
    try {
      const res = await axios.get(`${apiUrl}/api/pengaduan/chat/${phone}`);
      if (res.data?.data) {
        setMessages(res.data.data);
      }
    } catch (e) {
      // Offline fallback
    }
  };

  useEffect(() => {
    if (!isOpen || !citizenPhone) return;

    const socket = io(apiUrl);
    socket.emit('join_public_room');

    socket.on('new_pengaduan_message', (newMsg: any) => {
      if (newMsg.senderNumber === citizenPhone) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    socket.on('pengaduan_reply_sent', (replyMsg: any) => {
      if (replyMsg.senderNumber === citizenPhone) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === replyMsg.id)) return prev;
          return [...prev, replyMsg];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [apiUrl, citizenPhone, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = citizenPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      alert('Masukkan nomor WhatsApp yang valid (minimal 9-13 digit).');
      return;
    }
    localStorage.setItem('bumdes_wa_phone', cleanPhone);
    localStorage.setItem('bumdes_wa_name', citizenName || `Warga (${cleanPhone})`);
    setCitizenPhone(cleanPhone);
    setIsRegistered(true);
    fetchChatHistory(cleanPhone);

    // Initial greeting from bot
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          senderName: 'Bot WhatsApp BUMDes',
          message:
            `Halo ${citizenName || 'Warga'}! 👋 Selamat datang di WhatsApp Resmi BUMDes Banyubening.\n\n` +
            `Ketik atau klik perintah cepat di bawah ini:\n` +
            `• *#produk* : Lihat info katalog produk\n` +
            `• *#program* : Lihat info progres program kerja\n` +
            `• *#info* : Menu bantuan bot\n\n` +
            `Atau ketik pesan pengaduan biasa untuk dihubungkan langsung dengan Admin BUMDes!`,
          direction: 'OUTGOING',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const msgText = (textToSend || inputMsg).trim();
    if (!msgText || loading) return;

    setLoading(true);
    setInputMsg('');

    // Optimistic UI for outgoing citizen message
    const tempId = `temp-${Date.now()}`;
    const newCitizenMsg = {
      id: tempId,
      senderNumber: citizenPhone,
      senderName: citizenName || citizenPhone,
      message: msgText,
      direction: 'INCOMING',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newCitizenMsg]);

    try {
      const res = await axios.post(`${apiUrl}/api/pengaduan/chat`, {
        senderNumber: citizenPhone,
        senderName: citizenName,
        message: msgText,
      });

      if (res.data?.success) {
        // If bot reply occurred synchronously
        if (res.data.isBotReply && res.data.botReply) {
          setMessages((prev) => [...prev, res.data.botReply]);
        }
      }
    } catch (e) {
      // Keep optimistic message
    } finally {
      setLoading(false);
    }
  };

  const quickCommands = [
    { label: '#info', icon: HelpCircle, text: '#info' },
    { label: '#produk', icon: ShoppingBag, text: '#produk' },
    { label: '#program', icon: Briefcase, text: '#program' },
  ];

  return (
    <>
      {/* Floating Green WhatsApp Logo Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center border-2 border-white/90 group"
        aria-label="Buka Chat WhatsApp BUMDes"
      >
        <MessageCircle className="w-8 h-8 fill-white text-[#25D366] group-hover:scale-105 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* WhatsApp Shell Chat Widget Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] h-[520px] rounded-3xl overflow-hidden shadow-2xl border border-white/80 flex flex-col bg-[#ECE5DD] animate-fadeIn">
          {/* Authentic WhatsApp Green Header (#075E54) */}
          <div className="bg-[#075E54] px-4 py-3 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 p-1 flex items-center justify-center border border-white/30 overflow-hidden">
                <img
                  src={
                    (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') +
                    (identity.logoUrl || '/images/logo-bumdes.svg')
                  }
                  alt="Avatar"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/favicon.ico';
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight">
                    {identity.name || 'BUMDes Banyubening'}
                  </span>
                  <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                </div>
                <div className="text-[10px] text-white/90 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                  <span>Online &bull; Bot & Layanan Pengaduan</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Tutup Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Body (WhatsApp Shell with Fonnte System Engine) */}
          {!isRegistered ? (
            /* Registration Step */
            <div className="flex-1 p-6 flex flex-col justify-center bg-[#ECE5DD] space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[#25D366]/20 text-[#075E54] flex items-center justify-center mx-auto shadow-inner">
                <MessageCircle className="w-8 h-8 fill-[#25D366]" />
              </div>

              <div>
                <h4 className="font-bold text-base text-[#075E54]">
                  WhatsApp Shell &bull; Sistem Fonnte
                </h4>
                <p className="text-xs text-[#111B21]/75 mt-1">
                  Masukkan Nama dan Nomor WhatsApp Anda untuk memulai percakapan dengan Bot Otomatis atau Admin BUMDes.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-bold text-[#075E54] mb-1">
                    Nama Anda *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#075E54]/60 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="Contoh: Pak Budi"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#075E54]/30 text-xs focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#075E54] mb-1">
                    Nomor WhatsApp Anda *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#075E54]/60 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      placeholder="0812xxxxxx"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#075E54]/30 text-xs focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs shadow-md transition-colors"
                >
                  Mulai Obrolan WhatsApp
                </button>
              </form>
            </div>
          ) : (
            /* Chat Viewport */
            <div className="flex-1 flex flex-col overflow-hidden bg-[#ECE5DD]">
              {/* Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {/* Security encryption banner */}
                <div className="p-2 rounded-lg bg-[#FFF5C4] text-[#544314] text-[10px] text-center shadow-sm font-medium">
                  🔒 Pesan Anda diproses langsung oleh sistem Fonnte Gateway BUMDes Banyubening secara aman.
                </div>

                {messages.map((msg, idx) => {
                  const isCitizen = msg.direction === 'INCOMING';
                  const isBot =
                    msg.senderName === 'Bot WhatsApp BUMDes' ||
                    msg.senderName?.toLowerCase().includes('bot');

                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex ${isCitizen ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl shadow-sm text-xs leading-relaxed relative ${
                          isCitizen
                            ? 'bg-[#D9FDD3] text-[#111B21] rounded-tr-none'
                            : 'bg-white text-[#111B21] rounded-tl-none border border-black/5'
                        }`}
                      >
                        {/* Sender Label */}
                        {!isCitizen && (
                          <div className="text-[10px] font-extrabold text-[#075E54] mb-1 flex items-center gap-1">
                            {isBot ? <Bot className="w-3 h-3" /> : null}
                            <span>{msg.senderName || 'Admin BUMDes'}</span>
                          </div>
                        )}

                        <div className="whitespace-pre-line break-words">{msg.message}</div>

                        {/* Timestamp & double checkmark */}
                        <div className="flex items-center justify-end gap-1 text-[9px] text-[#667781] mt-1">
                          <span>
                            {new Date(msg.timestamp || Date.now()).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isCitizen && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Command Chips */}
              <div className="px-3 py-1.5 bg-[#F0F2F5] border-t border-black/5 flex items-center gap-1.5 overflow-x-auto shrink-0">
                <span className="text-[10px] font-bold text-[#075E54] shrink-0">Perintah Bot:</span>
                {quickCommands.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.label}
                      onClick={() => handleSendMessage(cmd.text)}
                      disabled={loading}
                      className="px-2.5 py-1 rounded-full bg-white border border-[#075E54]/30 text-[#075E54] text-[10px] font-bold hover:bg-[#25D366] hover:text-white transition-colors flex items-center gap-1 shrink-0 shadow-sm"
                    >
                      <Icon className="w-3 h-3" />
                      <span>{cmd.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-2 bg-[#F0F2F5] flex items-center gap-2 shrink-0 border-t border-black/5"
              >
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Ketik #info, #produk, atau pengaduan..."
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-full bg-white border border-black/10 text-xs text-[#111B21] focus:outline-none focus:ring-1 focus:ring-[#075E54]"
                />

                <button
                  type="submit"
                  disabled={loading || !inputMsg.trim()}
                  className="p-2.5 rounded-full bg-[#00A884] hover:bg-[#075E54] text-white shadow-md transition-colors disabled:opacity-40"
                  aria-label="Kirim"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};
