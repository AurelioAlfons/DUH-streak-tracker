"use client";

import { useEffect, useState } from "react";

function fromBase64(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export default function FallbackWarning({ checkedIn }: { checkedIn: boolean }) {
  const [late, setLate] = useState(false);
  const [canEnable, setCanEnable] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLate(new Date().getHours() >= 22);
      setCanEnable("serviceWorker" in navigator && "PushManager" in window && Notification.permission !== "granted");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function enablePush() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setMessage("Push isn’t configured yet.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setMessage("Notifications stayed off. The 10PM banner still has you.");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: fromBase64(publicKey),
    });
    const body = { ...subscription.toJSON(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMessage(response.ok ? "10PM reminders are on." : "Couldn’t save notifications. Try again.");
    if (response.ok) setCanEnable(false);
  }

  return (
    <aside className="reminder-zone">
      {late && !checkedIn && <p className="late-warning">IT’S AFTER 10PM. CHECK IN BEFORE MIDNIGHT.</p>}
      {canEnable && <button onClick={enablePush}>ENABLE 10PM REMINDER</button>}
      {message && <p>{message}</p>}
      <p className="ios-note">iPhone? Install from Safari first: Share → Add to Home Screen.</p>
    </aside>
  );
}
