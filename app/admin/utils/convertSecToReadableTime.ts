export function convertSecondsToReadableTime(seconds: number) {
  console.log(`convertSecondsToReadableTime`, seconds);
  seconds = seconds || 0;
  seconds = Number(seconds);
  seconds = Math.abs(seconds);

  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];

  if (d > 0) {
    parts.push(d + " Day" + (d > 1 ? "s" : ""));
  }

  if (h > 0) {
    parts.push(h + " Hour" + (h > 1 ? "s" : ""));
  }

  if (m > 0) {
    parts.push(m + " Minute" + (m > 1 ? "s" : ""));
  }

  if (s > 0) {
    parts.push(s + " Second" + (s > 1 ? "s" : ""));
  }

  console.log(seconds, d, h, m, s);
  return parts.join(", ");
}

export function getDayFromSeconds(seconds: number) {
  seconds = seconds || 0;
  seconds = Number(seconds);
  seconds = Math.abs(seconds);

  return Math.floor(seconds / (3600 * 24));
}
