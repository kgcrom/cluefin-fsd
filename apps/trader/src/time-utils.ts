export function getKstHour(now: Date = new Date()): number {
  const kstOffset = 9 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const kstMinutes = utcMinutes + kstOffset;
  return Math.floor(kstMinutes / 60) % 24;
}

export function getKstMinute(now: Date = new Date()): number {
  const kstOffset = 9 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const kstMinutes = utcMinutes + kstOffset;
  return kstMinutes % 60;
}

export function isOrderExecutionTime(now: Date = new Date()): boolean {
  const hour = getKstHour(now);
  const minute = getKstMinute(now);
  const totalMinutes = hour * 60 + minute;
  // KST 09:10 ~ 15:00
  return totalMinutes >= 9 * 60 + 10 && totalMinutes <= 15 * 60;
}

export function isFillCheckTime(now: Date = new Date()): boolean {
  const hour = getKstHour(now);
  // KST 16:00 ~ 17:59
  return hour >= 16 && hour <= 17;
}
