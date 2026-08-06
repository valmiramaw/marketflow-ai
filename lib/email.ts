import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

let resendClient: Resend | null = null

function getResend(): Resend | null {
  if (resendClient) return resendClient
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  resendClient = new Resend(apiKey)
  return resendClient
}

function getNotificationEmails(): string[] {
  const emails = process.env.NOTIFICATION_EMAILS
  if (!emails) return []
  return emails.split(',').map((e) => e.trim()).filter(Boolean)
}

const FROM_EMAIL = process.env.NOTIFICATION_FROM || 'MarketFlow AI <notifications@resend.dev>'

export interface NotificationPayload {
  subject: string
  body: string
  module: 'sales' | 'seo' | 'competitors' | 'social' | 'email' | 'automations' | 'reports' | 'system'
  actionUrl?: string
}

/**
 * Sendet eine interne Benachrichtigung an alle konfigurierten Empfänger.
 * Fire-and-forget — Fehler werden geloggt aber nicht geworfen.
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  let recipients = getNotificationEmails()
  if (recipients.length === 0) return false

  // Präferenz-Check: deaktivierte Empfänger rausfiltern (fail-open bei DB-Fehler)
  try {
    const disabled = await prisma.notificationPreference.findMany({
      where: { email: { in: recipients }, module: payload.module, enabled: false },
      select: { email: true },
    })
    const disabledSet = new Set(disabled.map((d) => d.email))
    recipients = recipients.filter((e) => !disabledSet.has(e))
    if (recipients.length === 0) return false
  } catch {
    // fail-open: bei DB-Fehler an alle senden
  }

  const moduleLabels: Record<string, string> = {
    sales: 'Sales',
    seo: 'SEO',
    competitors: 'Wettbewerber',
    social: 'Social Media',
    email: 'E-Mail',
    automations: 'Automations',
    reports: 'Berichte',
    system: 'System',
  }

  const moduleColors: Record<string, string> = {
    sales: '#a855f7',
    seo: '#22c55e',
    competitors: '#14b8a6',
    social: '#ec4899',
    email: '#3b82f6',
    automations: '#f59e0b',
    reports: '#6366f1',
    system: '#6b7280',
  }

  const color = moduleColors[payload.module] || '#3b82f6'
  const label = moduleLabels[payload.module] || payload.module

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 16px 20px; border-radius: 12px 12px 0 0;">
        <h2 style="color: white; margin: 0; font-size: 18px;">⚡ MarketFlow AI</h2>
      </div>
      <div style="background: #1a1a2e; border: 1px solid #2a2a4a; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <div style="margin-bottom: 16px;">
          <span style="background: ${color}20; color: ${color}; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;">
            ${label}
          </span>
        </div>
        <h3 style="color: #e2e8f0; margin: 0 0 12px; font-size: 16px;">${payload.subject}</h3>
        <p style="color: #94a3b8; margin: 0 0 20px; font-size: 14px; line-height: 1.6; white-space: pre-line;">${payload.body}</p>
        ${payload.actionUrl ? `
          <a href="${payload.actionUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
            Im Dashboard ansehen →
          </a>
        ` : ''}
        <hr style="border: none; border-top: 1px solid #2a2a4a; margin: 20px 0;" />
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          Diese Benachrichtigung wurde automatisch von MarketFlow AI gesendet.
        </p>
      </div>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject: `[MarketFlow] ${payload.subject}`,
      html,
    })
    return true
  } catch (error) {
    console.error('[Email] Benachrichtigung fehlgeschlagen:', error)
    return false
  }
}

/**
 * Prüft ob E-Mail-Benachrichtigungen konfiguriert sind.
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && getNotificationEmails().length > 0
}
