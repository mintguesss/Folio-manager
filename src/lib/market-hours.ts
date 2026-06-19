// Pure function — works on both server and client
export function isMarketHours(now: Date = new Date()): boolean {
  // Compute Taipei time (UTC+8)
  const taipeiMs = now.getTime() + 8 * 60 * 60 * 1000;
  const taipei = new Date(taipeiMs);
  const h = taipei.getUTCHours();
  const m = taipei.getUTCMinutes();
  const day = taipei.getUTCDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const mins = h * 60 + m;
  const twOpen = mins >= 9 * 60 && mins <= 13 * 60 + 30;
  const usOpen = mins >= 21 * 60 + 30 || mins <= 4 * 60;
  return twOpen || usOpen;
}
