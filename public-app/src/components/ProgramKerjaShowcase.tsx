'use client';

import React, { useState } from 'react';
import axios from 'axios';
import {
  Calendar,
  Users,
  MessageCircle,
  Smile,
  CornerDownRight,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export interface ProgramBlock {
  id?: string;
  type: 'text' | 'image';
  content: string;
  orderIndex?: number;
}

export interface CommentItem {
  id: string;
  programKerjaId: string;
  name: string;
  text: string;
  createdAt: string;
  parentId?: string | null;
}

export interface ProgramKerjaItem {
  id: string;
  title: string;
  date: string;
  teamName: string;
  isCommentEnabled: boolean;
  blocks: ProgramBlock[];
  comments?: CommentItem[];
  commentCount?: number;
}

export const ProgramKerjaShowcase: React.FC<{
  programs: ProgramKerjaItem[];
  onCommentSubmitted?: () => void;
}> = ({ programs, onCommentSubmitted }) => {
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    programs && programs[0] ? programs[0].id : ''
  );
  const [textPageIndexes, setTextPageIndexes] = useState<Record<number, number>>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; mention: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const activeProgram =
    programs && programs.length > 0
      ? programs.find((p) => p.id === selectedProgramId) || programs[0]
      : null;

  // Helper to split a long text block into pages (chunks of ~450 characters or paragraphs)
  const getPagesForText = (content: string): string[] => {
    const paragraphs = content.split(/\n+/).filter(Boolean);
    if (paragraphs.length <= 1 && content.length < 500) {
      return [content];
    }

    const pages: string[] = [];
    let currentPage = '';

    for (const p of paragraphs) {
      if ((currentPage + '\n\n' + p).length > 550) {
        if (currentPage) pages.push(currentPage.trim());
        currentPage = p;
      } else {
        currentPage = currentPage ? currentPage + '\n\n' + p : p;
      }
    }
    if (currentPage) pages.push(currentPage.trim());
    return pages.length > 0 ? pages : [content];
  };

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleReplyClick = (comment: CommentItem) => {
    const mention = `@Email (To leave a comment, you must first login with your email, the email address will stored in the admin dashboard-only the email itself, not the password-to ensure privacy) `;
    setReplyTo({ id: comment.id, mention });
    setText(`Membalas ${mention}`);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProgram) return;
    if (!name || !email || !text) {
      setFeedbackMsg('Mohon lengkapi Nama, Email, dan Isi Komentar.');
      return;
    }

    setSubmitting(true);
    setFeedbackMsg(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await axios.post(`${apiUrl}/api/program-kerja/${activeProgram.id}/comments`, {
        name,
        email,
        text,
        parentId: replyTo?.id || undefined,
      });

      setName('');
      setEmail('');
      setText('');
      setReplyTo(null);
      setFeedbackMsg('Komentar Anda berhasil dikirim! Terima kasih atas partisipasinya.');
      if (onCommentSubmitted) onCommentSubmitted();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Gagal mengirim komentar.';
      setFeedbackMsg(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Group comments into parent comments and their nested replies
  const commentsList = (activeProgram && activeProgram.comments) || [];
  const parentComments = commentsList.filter((c) => !c.parentId);
  const replyMap = new Map<string, CommentItem[]>();
  commentsList.forEach((c) => {
    if (c.parentId) {
      const existing = replyMap.get(c.parentId) || [];
      existing.push(c);
      replyMap.set(c.parentId, existing);
    }
  });

  return (
    <section id="program-kerja" className="w-full py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto">
        {/* Modern Rustic Title Header */}
        <div className="text-center space-y-3 mb-12">
          <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#87A96B]/20 text-[#3B7A57]">
            Rencana & Realisasi Kerja
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#4A4A4A] font-serif">
            Program Kerja BUMDes &bull; <span className="text-[#3B7A57]">Banyubening</span>
          </h2>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#4A4A4A]/80 font-sans">
            Showcase interaktif rancangan dan kemajuan nyata pembangunan ekonomi serta pelestarian mata air desa.
          </p>
        </div>

        {/* Program Selector Tabs */}
        {programs && programs.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {programs.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProgramId(p.id)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                  activeProgram && p.id === activeProgram.id
                    ? 'bg-[#3B7A57] text-white shadow-lg scale-105'
                    : 'bg-[#FFFDD0] text-[#4A4A4A] border border-[#87A96B]/30 hover:bg-[#87A96B]/20'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        )}

        {!activeProgram ? (
          <div className="glass-card p-12 text-center max-w-2xl mx-auto space-y-3 border-dashed border-emerald-300/80 bg-white/70">
            <h3 className="font-extrabold text-lg text-emerald-950">
              Program Kerja Belum Dipublikasikan
            </h3>
            <p className="text-sm text-emerald-900/75">
              Rencana dan realisasi kerja BUMDes Banyubening sedang dipersiapkan dan akan segera diunggah oleh Admin.
            </p>
          </div>
        ) : (
          <div className="bg-[#FFFDD0] border-2 border-[#87A96B]/30 rounded-3xl p-6 sm:p-10 shadow-xl space-y-10">
            {/* Top Header: Title, Date, Team */}
            <div className="border-b-2 border-[#87A96B]/20 pb-6 space-y-4">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#4A4A4A] font-serif leading-tight">
                {activeProgram.title}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-[#3B7A57]">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#87A96B]/20">
                  <Calendar className="w-4 h-4" />
                  <span>{activeProgram.date}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#87A96B]/20">
                  <Users className="w-4 h-4" />
                  <span>{activeProgram.teamName}</span>
                </div>
              </div>
          </div>

          {/* Alternating Text and Image Stream */}
          <div className="space-y-12">
            {(activeProgram.blocks || []).map((block, idx) => {
              if (block.type === 'text') {
                const pages = getPagesForText(block.content);
                const currentPage = textPageIndexes[idx] || 0;
                const totalPages = pages.length;

                return (
                  <div key={idx} className="bg-white/80 p-6 sm:p-8 rounded-2xl border border-[#87A96B]/25 shadow-sm">
                    <div className="prose max-w-none text-base sm:text-lg text-[#4A4A4A] leading-relaxed whitespace-pre-line animate-fadeIn">
                      {pages[currentPage]}
                    </div>

                    {/* Pagination for long text block */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#87A96B]/20">
                        <span className="text-xs sm:text-sm font-semibold text-[#3B7A57]">
                          Halaman {currentPage + 1} dari {totalPages}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setTextPageIndexes((prev) => ({
                                ...prev,
                                [idx]: Math.max(0, currentPage - 1),
                              }))
                            }
                            disabled={currentPage === 0}
                            className="p-2 rounded-xl bg-[#FFFDD0] border border-[#87A96B]/30 text-[#3B7A57] disabled:opacity-40 hover:bg-[#87A96B]/20 transition-colors"
                            aria-label="Previous Page"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              setTextPageIndexes((prev) => ({
                                ...prev,
                                [idx]: Math.min(totalPages - 1, currentPage + 1),
                              }))
                            }
                            disabled={currentPage === totalPages - 1}
                            className="p-2 rounded-xl bg-[#FFFDD0] border border-[#87A96B]/30 text-[#3B7A57] disabled:opacity-40 hover:bg-[#87A96B]/20 transition-colors"
                            aria-label="Next Page"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Image Block with Zoom on hover
              const imgUrl =
                block.content.startsWith('/')
                  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + block.content
                  : block.content;

              return (
                <div key={idx} className="overflow-hidden rounded-2xl border-4 border-white shadow-md">
                  <div className="relative overflow-hidden group">
                    <img
                      src={imgUrl}
                      alt={`Dokumentasi Program Kerja ${idx + 1}`}
                      className="w-full max-h-[480px] object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/program-air-1.svg';
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Commenting System (Instagram-style Threaded Replies) */}
          <div className="pt-10 border-t-2 border-[#87A96B]/20 space-y-8">
            <div className="flex items-center justify-between">
              <h4 className="text-xl sm:text-2xl font-bold text-[#4A4A4A] flex items-center gap-2 font-serif">
                <MessageCircle className="w-6 h-6 text-[#3B7A57]" />
                <span>Komentar & Partisipasi Warga ({commentsList.length})</span>
              </h4>
            </div>

            {/* Admin Comment Toggle Enforcement */}
            {!activeProgram.isCommentEnabled ? (
              <div className="p-6 rounded-2xl bg-white/75 border-2 border-[#87A96B]/30 text-center text-[#4A4A4A] font-medium flex items-center justify-center gap-3">
                <Lock className="w-5 h-5 text-merahJambu shrink-0" />
                <span>🔒 Kolom komentar untuk program kerja ini telah dinonaktifkan oleh Admin.</span>
              </div>
            ) : (
              <>
                {/* Threaded Comments Stream */}
                <div className="space-y-6">
                  {parentComments.length === 0 ? (
                    <p className="text-sm text-[#4A4A4A]/70 italic">
                      Belum ada komentar untuk program kerja ini. Jadilah yang pertama memberikan masukan!
                    </p>
                  ) : (
                    parentComments.map((comment) => {
                      const replies = replyMap.get(comment.id) || [];
                      return (
                        <div key={comment.id} className="space-y-3">
                          {/* Parent Comment */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#87A96B]/25 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm sm:text-base text-[#3B7A57]">
                                {comment.name}
                              </span>
                              <button
                                onClick={() => handleReplyClick(comment)}
                                className="text-xs font-semibold text-[#3B7A57] hover:underline flex items-center gap-1"
                              >
                                <CornerDownRight className="w-3.5 h-3.5" />
                                <span>Balas</span>
                              </button>
                            </div>
                            <p className="text-sm sm:text-base text-[#4A4A4A] leading-relaxed">
                              {comment.text}
                            </p>
                          </div>

                          {/* Threaded Replies (indented) */}
                          {replies.length > 0 && (
                            <div className="pl-6 sm:pl-10 space-y-3 border-l-2 border-[#87A96B]/30">
                              {replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className="p-3.5 sm:p-4 rounded-2xl bg-white/90 border border-[#87A96B]/20 shadow-sm space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs sm:text-sm text-[#3B7A57]">
                                      {reply.name}
                                    </span>
                                    <span className="text-[10px] text-[#4A4A4A]/60">Balasan</span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
                                    {reply.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Comment Form with Emoji Picker & Reply Mention */}
                <form
                  onSubmit={handleSubmitComment}
                  className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#87A96B]/30 shadow-md space-y-4 relative"
                >
                  <h5 className="font-bold text-base sm:text-lg text-[#3B7A57]">
                    {replyTo ? 'Tulis Balasan Komentar' : 'Berikan Komentar atau Apresiasi'}
                  </h5>

                  {replyTo && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFFDD0] border border-[#87A96B]/30 text-xs">
                      <span className="font-semibold text-[#3B7A57]">
                        Membalas komentar terpilih
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(null);
                          setText('');
                        }}
                        className="text-merahJambu font-bold hover:underline"
                      >
                        Batal Balas
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#4A4A4A] mb-1">
                        Nama Anda *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Budi (Warga Dusun 2)"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#87A96B]/40 text-sm text-[#4A4A4A] focus:outline-none focus:ring-2 focus:ring-[#3B7A57]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#4A4A4A] mb-1">
                        Email Anda (Hanya untuk Admin BUMDes) *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@banyubening.id"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#87A96B]/40 text-sm text-[#4A4A4A] focus:outline-none focus:ring-2 focus:ring-[#3B7A57]"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-semibold text-[#4A4A4A] mb-1">
                      Komentar *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Tuliskan apresiasi, saran, atau pertanyaan Anda untuk program ini..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#87A96B]/40 text-sm text-[#4A4A4A] focus:outline-none focus:ring-2 focus:ring-[#3B7A57] pr-12"
                    />

                    {/* Smiley Emoji Button */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-3 top-8 p-1.5 rounded-lg text-[#3B7A57] hover:bg-[#87A96B]/20 transition-colors"
                      aria-label="Pilih Emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>

                    {/* Emoji Picker Popup */}
                    {showEmojiPicker && (
                      <div className="absolute right-0 bottom-full mb-2 bg-white border-2 border-[#87A96B]/40 rounded-2xl p-2.5 shadow-xl flex items-center gap-2 z-30">
                        {['❤️', '👍', '👏', '🔥', '🙌'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiClick(emoji)}
                            className="text-2xl hover:scale-125 transition-transform p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {feedbackMsg && (
                    <div className="p-3 rounded-xl bg-[#87A96B]/15 border border-[#3B7A57]/30 text-xs text-[#3B7A57] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{feedbackMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#3B7A57] text-white font-bold text-sm shadow hover:bg-[#2D5A40] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Mengirim...' : 'Kirim Komentar'}</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
        )}
      </div>
    </section>
  );
};
