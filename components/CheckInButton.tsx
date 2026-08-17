"use client";

import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";
import type { StreakState } from "@/app/page";

type Props = {
  status: StreakState["todayStatus"];
  ready: boolean;
  onCheckIn: () => Promise<StreakState>;
};

export default function CheckInButton({ status, ready, onCheckIn }: Props) {
  const [alreadyTracked, setAlreadyTracked] = useState(false);
  const [milestoneDays, setMilestoneDays] = useState<number | null>(null);
  const saving = useRef(false);
  const noticeTimer = useRef<number | null>(null);
  const milestoneTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    if (milestoneTimer.current !== null) window.clearTimeout(milestoneTimer.current);
  }, []);

  function showAlreadyTracked() {
    setAlreadyTracked(true);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setAlreadyTracked(false), 1100);
  }

  function checkIn() {
    if (!ready) return;
    if (status === "success" || saving.current) {
      showAlreadyTracked();
      return;
    }

    // celebrate now; the idempotent API confirms the record in the background
    saving.current = true;
    if ("vibrate" in navigator) navigator.vibrate(35);
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.68 }, colors: ["#ff6b57", "#ffcb55", "#8a62e8", "#fff4d6"] });
    void onCheckIn()
      .then((saved) => {
        if (!saved.milestone) return;
        setMilestoneDays(saved.currentStreak);
        if ("vibrate" in navigator) navigator.vibrate([55, 45, 90]);
        confetti({
          particleCount: 220,
          spread: 115,
          startVelocity: 52,
          scalar: 1.2,
          ticks: 240,
          origin: { y: 0.58 },
          colors: ["#ff6b57", "#ff9d4d", "#6d3fd6", "#fff4d6"],
        });
        if (milestoneTimer.current !== null) window.clearTimeout(milestoneTimer.current);
        milestoneTimer.current = window.setTimeout(() => setMilestoneDays(null), 3200);
      })
      .catch(() => undefined)
      .finally(() => {
        saving.current = false;
      });
  }

  const done = status === "success";
  return (
    <div className="check-in-wrap">
      <button className={`check-in ${done ? "done" : ""}`} onClick={checkIn} disabled={!ready}>
        <span className="button-icon">{done ? "✓" : "✦"}</span>
        <span aria-live="polite">{!ready ? "SYNCING..." : alreadyTracked ? "ALREADY TRACKED TODAY BRUH" : done ? "DONE TODAY" : "STILL CLEAN"}</span>
        <small>{!ready ? "LOADING SAVED RECORD" : alreadyTracked ? "YEP. WE GOT IT." : done ? "NICE. SEE YOU TOMORROW." : "TAP TO CHECK IN"}</small>
      </button>
      {milestoneDays !== null && (
        <div className="milestone-callout" role="status">
          MILESTONE! {milestoneDays} DAYS!
        </div>
      )}
    </div>
  );
}
