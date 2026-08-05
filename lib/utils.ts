import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('de-DE').format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'percent', minimumFractionDigits: 1 }).format(value / 100)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('de-DE').format(new Date(date))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
