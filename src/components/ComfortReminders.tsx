import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, Clock, Sparkles, RefreshCw } from 'lucide-react';
import { useReaderStore } from '../stores/readerStore';

interface ComfortRemindersProps {
  activeAlert: 'blink' | 'rule2020' | 'pomodoroBreak' | 'pomodoroWork' | null;
  onDismiss: () => void;
}

export const ComfortReminders: React.FC<ComfortRemindersProps> = ({ activeAlert, onDismiss }) => {
  const [secondsLeft, setSecondsLeft] = useState(20);
  const { theme } = useReaderStore();

  useEffect(() => {
    let interval: number | undefined;
    if (activeAlert === 'rule2020') {
      setSecondsLeft(20);
      interval = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeAlert]);

  if (!activeAlert) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        {activeAlert === 'blink' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl p-6"
            style={{
              backgroundColor: theme.isDark ? '#1F2937' : '#FFFFFF',
              borderColor: theme.border,
              color: theme.text,
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                <Eye className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-semibold text-lg" style={{ color: theme.isDark ? '#FFF' : '#111' }}>
                  Blink Reminder
                </h3>
                <p className="text-sm opacity-80">Eye health notification</p>
              </div>
            </div>
            
            <p className="text-sm leading-relaxed mb-6">
              You've been reading continuously for 20 minutes. People tend to blink 60% less while looking at screens, causing dry eyes and strain.
              <br />
              <strong className="block mt-2 font-medium">Please blink consciously a few times and rest your eyes.</strong>
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onDismiss}
                className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all hover:brightness-95 active:scale-98"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.isDark ? '#000' : '#FFF',
                }}
              >
                Okay, dismissed
              </button>
            </div>
          </motion.div>
        )}

        {activeAlert === 'rule2020' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 text-center text-white"
            style={{
              background: 'radial-gradient(circle, #0F2A1D 0%, #050D0A 100%)', // Relaxing deep forest green
            }}
          >
            <div className="max-w-xl flex flex-col items-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full flex items-center justify-center mb-6"
              >
                <Clock className="w-8 h-8 text-emerald-400" />
              </motion.div>

              <h2 className="text-3xl font-bold tracking-tight mb-4 text-emerald-100">
                20-20-20 Eye Exercise Break
              </h2>

              <p className="text-lg text-emerald-200/80 max-w-md mx-auto mb-10">
                Look away from your screen. Focus on an object at least <span className="text-emerald-300 font-semibold">20 feet away</span> for <span className="text-emerald-300 font-semibold">20 seconds</span>.
              </p>

              {/* Breathing / Visual Guide Ring */}
              <div className="relative w-48 h-48 flex items-center justify-center mb-12">
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.1, 0.4, 0.1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 bg-emerald-500 rounded-full"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.2, 0.6, 0.2],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                  }}
                  className="absolute w-36 h-36 bg-emerald-400 rounded-full"
                />
                <div className="absolute w-24 h-24 bg-emerald-950/80 border border-emerald-500/40 rounded-full flex flex-col items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-emerald-300">{secondsLeft}s</span>
                  <span className="text-xs text-emerald-400 uppercase tracking-widest font-semibold mt-1">Remain</span>
                </div>
              </div>

              <div className="flex gap-4">
                {secondsLeft === 0 ? (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={onDismiss}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-emerald-950 font-bold rounded-xl shadow-lg transition-all"
                  >
                    Resume Reading
                  </motion.button>
                ) : (
                  <button
                    onClick={onDismiss}
                    className="px-6 py-2.5 border border-emerald-500/30 hover:bg-emerald-500/10 active:scale-98 text-emerald-400 font-medium rounded-xl text-sm transition-all"
                  >
                    Skip Exercise
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {(activeAlert === 'pomodoroBreak' || activeAlert === 'pomodoroWork') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl p-6 text-center"
            style={{
              backgroundColor: theme.isDark ? '#1F2937' : '#FFFFFF',
              borderColor: theme.border,
              color: theme.text,
            }}
          >
            <div className="mx-auto w-16 h-16 bg-violet-500/10 text-violet-500 rounded-full flex items-center justify-center mb-4">
              {activeAlert === 'pomodoroBreak' ? (
                <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
              ) : (
                <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
              )}
            </div>

            <h3 className="font-bold text-2xl mb-2" style={{ color: theme.isDark ? '#FFF' : '#111' }}>
              {activeAlert === 'pomodoroBreak' ? 'Time for a Rest!' : 'Focus Session Started!'}
            </h3>
            
            <p className="text-sm opacity-80 mb-6">
              {activeAlert === 'pomodoroBreak'
                ? "Your 25-minute Pomodoro focus period has ended. Take a 5-minute break. Close your eyes, walk around, or stretch."
                : "Your break is over. Time to begin another 25-minute focused reading session."}
            </p>

            <button
              onClick={onDismiss}
              className="w-full py-3 rounded-xl font-bold transition-all hover:brightness-95 active:scale-98"
              style={{
                backgroundColor: theme.accent,
                color: theme.isDark ? '#000' : '#FFF',
              }}
            >
              {activeAlert === 'pomodoroBreak' ? 'Start Break' : 'Start Focus'}
            </button>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};
