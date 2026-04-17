import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, X, Loader2, Send } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface ScheduleSessionModalProps {
  sessionModal: any;
  sessionDateTime: string;
  sessionMessage: string;
  sessionSending: boolean;
  setSessionModal: (v: any) => void;
  setSessionDateTime: (v: string) => void;
  setSessionMessage: (v: string) => void;
  handleSendSessionInvite: () => void;
}

export default function ScheduleSessionModal(props: ScheduleSessionModalProps) {
  const {
    sessionModal, sessionDateTime, sessionMessage, sessionSending,
    setSessionModal, setSessionDateTime, setSessionMessage, handleSendSessionInvite,
  } = props;

  return (
    <AnimatePresence>
      {sessionModal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSessionModal(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-5">
              {sessionModal.game.artwork && (
                <img src={sessionModal.game.artwork} alt={sessionModal.game.title} className="w-14 h-20 object-cover rounded-xl shrink-0"/>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Schedule Session</p>
                <h3 className="font-bold italic font-serif tracking-tighter uppercase text-white text-lg leading-tight truncate">{sessionModal.game.title}</h3>
                <p className="text-xs text-white/40 mt-1">Everyone in your group has this game</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  value={sessionDateTime}
                  onChange={e => setSessionDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full bg-[#0a0a0a] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark]"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5">Message <span className="normal-case font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={sessionMessage}
                  onChange={e => setSessionMessage(e.target.value)}
                  placeholder="e.g. Let's finally play this!"
                  maxLength={120}
                  className="w-full bg-[#0a0a0a] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setSessionModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors text-white/50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendSessionInvite}
                disabled={!sessionDateTime || sessionSending}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {sessionSending ? <Loader2 size={12} className="animate-spin"/> : <Send size={12}/>}
                Notify Group
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
