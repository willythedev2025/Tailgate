// Venmo deep links — Clubhouse never touches money, it just makes settling up
// one tap. https://venmo.com/<user>?txn=pay&amount=20&note=... opens the Venmo
// app on mobile and the web flow on desktop.

export function parseFeeAmount(display: string | null | undefined): number | null {
  if (!display) return null;
  const match = display.replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function venmoPayUrl(handle: string, amount: number | null, note: string): string {
  const params = new URLSearchParams({ txn: "pay", note });
  if (amount) params.set("amount", String(amount));
  return `https://venmo.com/${encodeURIComponent(handle)}?${params.toString()}`;
}

export function smsDraftUrl(body: string): string {
  // No recipient — opens the composer so the commissioner picks the thread
  return `sms:?&body=${encodeURIComponent(body)}`;
}
