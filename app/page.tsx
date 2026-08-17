"use client";

import { useCallback, useEffect, useState } from "react";
import CheckInButton from "@/components/CheckInButton";
import FailButton from "@/components/FailButton";
import FallbackWarning from "@/components/FallbackWarning";
import StreakDisplay from "@/components/StreakDisplay";

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  todayStatus: "success" | "failed" | null;
  milestone: boolean;
};

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export default function HomePage() {
  const [state, setState] = useState<StreakState | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/streak/status?today=${today()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("load failed");
      setState((await response.json()) as StreakState);
      setError("");
    } catch {
      setError("Couldn’t load your streak. Try refreshing.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function save(path: string) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ today: today() }),
    });
    if (!response.ok) throw new Error("update failed");
    return (await response.json()) as StreakState;
  }

  async function update(path: string) {
    setError("");
    try {
      const next = await save(path);
      setState(next);
      return next;
    } catch (error) {
      setError("Couldn’t save that yet. Your previous record is still safe—try again.");
      throw error;
    }
  }

  async function checkInOptimistically() {
    if (!state) throw new Error("streak not loaded");
    if (state.todayStatus === "success") return state;

    const previous = state;
    const optimistic: StreakState = {
      currentStreak: previous.currentStreak + 1,
      longestStreak: Math.max(previous.longestStreak, previous.currentStreak + 1),
      todayStatus: "success",
      milestone: false,
    };

    // make the tap feel instant while Supabase confirms the durable record
    setError("");
    setState(optimistic);
    try {
      const saved = await save("/api/streak/check-in");
      setState(saved);
      return saved;
    } catch (error) {
      setState(previous);
      setError("Couldn’t save that yet. Your previous record is still safe—try again.");
      throw error;
    }
  }

  return (
    <main className="streak-shell">
      <div className="pixel-grid" aria-hidden="true" />
      <header>
        <span className="brand">DUH</span>
        <span className="header-note">ONE DAY AT A TIME</span>
      </header>
      <StreakDisplay
        current={state?.currentStreak ?? 0}
        longest={state?.longestStreak ?? 0}
        loading={!state}
      />
      <section className="quest">
        <p className="quest-label">TODAY’S QUEST</p>
        <h1>NO RELAPSE</h1>
        <CheckInButton ready={state !== null} status={state?.todayStatus ?? null} onCheckIn={checkInOptimistically} />
        <FailButton ready={state !== null} status={state?.todayStatus ?? null} onFail={() => update("/api/streak/fail")} />
        {error && <p className="page-error" role="alert">{error}</p>}
      </section>
      <FallbackWarning checkedIn={state?.todayStatus != null} />
    </main>
  );
}
