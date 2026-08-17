import webpush from "web-push";

export function configurePush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export function sendReminder(subscription: webpush.PushSubscription) {
  return webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: "Still clean today?",
      body: "Check in before the day slips away.",
      url: "/",
    }),
  );
}
