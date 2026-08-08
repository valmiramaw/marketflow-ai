const MINUTE = 60
const HOUR = 3600
const DAY = 86400
const WEEK = 604800
const MONTH = 2592000
const YEAR = 31536000

export function relativeTime(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 0) return 'gerade eben'
  if (diff < MINUTE) return 'gerade eben'
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE)
    return `vor ${m} Min.`
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR)
    return `vor ${h} Std.`
  }
  if (diff < WEEK) {
    const d = Math.floor(diff / DAY)
    return d === 1 ? 'gestern' : `vor ${d} Tagen`
  }
  if (diff < MONTH) {
    const w = Math.floor(diff / WEEK)
    return w === 1 ? 'vor 1 Woche' : `vor ${w} Wochen`
  }
  if (diff < YEAR) {
    const m = Math.floor(diff / MONTH)
    return m === 1 ? 'vor 1 Monat' : `vor ${m} Monaten`
  }
  const y = Math.floor(diff / YEAR)
  return y === 1 ? 'vor 1 Jahr' : `vor ${y} Jahren`
}
