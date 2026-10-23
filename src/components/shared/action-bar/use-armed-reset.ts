"use client";

import { useCallback, useRef, useState } from "react";

import { toast } from "sonner";

const ARM_SECONDS = 5;

// Two-step reset: the first click arms it and starts a countdown, a second
// confirm inside the window actually resets. The arm expires on its own.
export function useArmedReset(onReset?: () => void) {
  const [isResetArmed, setIsResetArmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ARM_SECONDS);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const disarmReset = useCallback(() => {
    setIsResetArmed(false);
    setTimeLeft(ARM_SECONDS);
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const armReset = useCallback(() => {
    setIsResetArmed(true);
    setTimeLeft(ARM_SECONDS);
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          disarmReset();
          return ARM_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    resetTimeoutRef.current = setTimeout(() => {
      disarmReset();
    }, ARM_SECONDS * 1000);
  }, [disarmReset]);

  const handleResetClick = useCallback(() => {
    if (!isResetArmed) {
      armReset();
    }
  }, [isResetArmed, armReset]);

  const handleConfirmReset = useCallback(() => {
    disarmReset();
    onReset?.();
    toast.success("Customizations reset");
  }, [disarmReset, onReset]);

  return { isResetArmed, timeLeft, disarmReset, handleResetClick, handleConfirmReset };
}
