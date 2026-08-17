"use client";

import { useEffect, useRef, useState } from "react";
import type { StreakState } from "@/app/page";

type Props = { status: StreakState["todayStatus"]; ready: boolean; onFail: () => Promise<StreakState> };

export default function FailButton({ status, ready, onFail }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [loading, setLoading] = useState(false);
  const failTimer = useRef<number | null>(null);
  const countdownTimer = useRef<number | null>(null);

  function clearTimers() {
    if (failTimer.current !== null) window.clearTimeout(failTimer.current);
    if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current);
    failTimer.current = null;
    countdownTimer.current = null;
  }

  useEffect(() => () => clearTimers(), []);

  async function commitFail() {
    clearTimers();
    setPending(false);
    setLoading(true);
    try {
      await onFail();
    } catch {
      setConfirming(true);
    } finally {
      setLoading(false);
    }
  }

  function scheduleFail() {
    const deadline = Date.now() + 4_000;
    setConfirming(false);
    setPending(true);
    setSecondsLeft(4);
    countdownTimer.current = window.setInterval(() => {
      setSecondsLeft(Math.max(1, Math.ceil((deadline - Date.now()) / 1_000)));
    }, 200);
    failTimer.current = window.setTimeout(() => void commitFail(), 4_000);
  }

  function undo() {
    clearTimers();
    setPending(false);
    setSecondsLeft(4);
  }

  function fail() {
    if (pending) {
      undo();
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }
    scheduleFail();
  }

  return (
    <button className="fail-button" onClick={fail} disabled={!ready || loading || status === "failed"}>
      {!ready
        ? "SYNCING SAVED RECORD"
        : status === "failed"
          ? "LOGGED. RESET AND GO AGAIN."
          : loading
            ? "LOGGING..."
            : pending
              ? `UNDO — LOGS IN ${secondsLeft}`
              : confirming
                ? "TAP AGAIN TO CONFIRM"
                : "I FAILED TODAY"}
    </button>
  );
}
