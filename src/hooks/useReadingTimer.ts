import { useEffect, useRef, useState } from 'react';
import { useReaderStore } from '../stores/readerStore';

export function useReadingTimer() {
  const {
    file,
    blinkReminderActive,
    rule202020Active,
    pomodoroActive,
    pomodoro,
    updatePomodoro,
    addReadingTime,
  } = useReaderStore();

  const [activeAlert, setActiveAlert] = useState<'blink' | 'rule2020' | 'pomodoroBreak' | 'pomodoroWork' | null>(null);

  const statsTimerRef = useRef<number | null>(null);
  const eyeComfortTimerRef = useRef<number | null>(null);
  const pomodoroTimerRef = useRef<number | null>(null);

  const blinkSecondsRef = useRef(0);
  const rule2020SecondsRef = useRef(0);

  // 1. Reading Time stats tracking (every 10 seconds of active reading)
  useEffect(() => {
    if (!file) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopStatsTimer();
      } else {
        startStatsTimer();
      }
    };

    const startStatsTimer = () => {
      if (statsTimerRef.current) return;
      statsTimerRef.current = window.setInterval(() => {
        addReadingTime(10);
      }, 10000);
    };

    const stopStatsTimer = () => {
      if (statsTimerRef.current) {
        clearInterval(statsTimerRef.current);
        statsTimerRef.current = null;
      }
    };

    startStatsTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopStatsTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [file, addReadingTime]);

  // 2. Eye comfort reminders (Blink and 20-20-20)
  useEffect(() => {
    if (!file) return;
    if (!blinkReminderActive && !rule202020Active) return;

    const startComfortTimer = () => {
      if (eyeComfortTimerRef.current) return;
      eyeComfortTimerRef.current = window.setInterval(() => {
        if (document.hidden) return;

        // Increment time
        if (blinkReminderActive) {
          blinkSecondsRef.current += 1;
          if (blinkSecondsRef.current >= 1200) { // 20 minutes = 1200 seconds
            setActiveAlert('blink');
            blinkSecondsRef.current = 0;
          }
        }

        if (rule202020Active) {
          rule2020SecondsRef.current += 1;
          if (rule2020SecondsRef.current >= 1200) {
            setActiveAlert('rule2020');
            rule2020SecondsRef.current = 0;
          }
        }
      }, 1000);
    };

    const stopComfortTimer = () => {
      if (eyeComfortTimerRef.current) {
        clearInterval(eyeComfortTimerRef.current);
        eyeComfortTimerRef.current = null;
      }
    };

    startComfortTimer();
    return () => stopComfortTimer();
  }, [file, blinkReminderActive, rule202020Active]);

  // 3. Pomodoro Timer
  useEffect(() => {
    if (!pomodoroActive || !pomodoro.isActive) {
      if (pomodoroTimerRef.current) {
        clearInterval(pomodoroTimerRef.current);
        pomodoroTimerRef.current = null;
      }
      return;
    }

    const tickPomodoro = () => {
      if (document.hidden) return;

      if (pomodoro.timeLeft <= 1) {
        // Timer completed! Swap modes
        const nextMode = pomodoro.mode === 'focus' ? 'break' : 'focus';
        const nextDuration = nextMode === 'focus' ? 25 * 60 : 5 * 60;
        
        updatePomodoro({
          mode: nextMode,
          timeLeft: nextDuration,
          duration: nextDuration,
        });

        // Trigger visual alert
        setActiveAlert(nextMode === 'break' ? 'pomodoroBreak' : 'pomodoroWork');
      } else {
        updatePomodoro({ timeLeft: pomodoro.timeLeft - 1 });
      }
    };

    pomodoroTimerRef.current = window.setInterval(tickPomodoro, 1000);

    return () => {
      if (pomodoroTimerRef.current) {
        clearInterval(pomodoroTimerRef.current);
        pomodoroTimerRef.current = null;
      }
    };
  }, [pomodoroActive, pomodoro.isActive, pomodoro.timeLeft, pomodoro.mode, updatePomodoro]);

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  return {
    activeAlert,
    dismissAlert,
  };
}
