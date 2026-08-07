'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Save, Eye, EyeOff, CheckCircle, XCircle, Key, Globe, Zap, Loader2, Unlink, Cloud, Bell, Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '../components/toast'

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>}>
      <SettingsContent />
    </Suspense>
  )
}

function SettingsContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [settings, setSettings] = useState({
    anthropicKey: '',
    openaiKey: '',
    geminiKey: '',
    awsAccessKeyId: '',
    awsSecretAccessKey: '',
    awsRegion: '',
  })
  const [showKeys, setShowKeys] = useState({
    anthropic: false,
    openai: false,
    gemini: false,
    awsAccessKey: false,
    awsSecret: false,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [googleStatus, setGoogleStatus] = useState<{
    connected: boolean
    accountName?: string
  }>({ connected: false })
  const [connectingGoogle, setConnectingGoogle] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [emailStatus, setEmailStatus] = useState<{
    configured: boolean
    hasApiKey: boolean
    hasRecipients: boolean
    recipientCount: number
  }>({ configured: false, hasApiKey: false, hasRecipients: false, recipientCount: 0 })
  const [sendingTest, setSendingTest] = useState(false)
  const [prefMatrix, setPrefMatrix] = useState<{
    emails: string[]
    modules: string[]
    preferences: Record<string, Record<string, boolean>>
  } | null>(null)
  const [togglingPref, setTogglingPref] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
    fetchGoogleStatus()
    fetchEmailStatus()
    fetchPreferences()
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success === 'google_connected') {
      setNotification('Google erfolgreich verbunden!')
      fetchGoogleStatus()
    }
    if (error) setNotification(`Fehler: ${error}`)
  }, [searchParams])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings({
          anthropicKey: data.anthropicKey || '',
          openaiKey: data.openaiKey || '',
          geminiKey: data.geminiKey || '',
          awsAccessKeyId: data.awsAccessKeyId || '',
          awsSecretAccessKey: data.awsSecretAccessKey || '',
          awsRegion: data.awsRegion || '',
        })
      }
    } catch {
      toast('Einstellungen konnten nicht geladen werden.', 'error')
    }
  }

  async function fetchGoogleStatus() {
    try {
      const res = await fetch('/api/integrations/google')
      if (res.ok) setGoogleStatus(await res.json())
    } catch { /* non-critical */ }
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        toast('Einstellungen gespeichert!', 'success')
      } else {
        toast('Einstellungen konnten nicht gespeichert werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler beim Speichern.', 'error')
    } finally { setSaving(false) }
  }

  async function connectGoogle() {
    setConnectingGoogle(true)
    try {
      const res = await fetch('/api/integrations/google', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
      }
    } catch {
      setNotification('Google OAuth Fehler')
    } finally { setConnectingGoogle(false) }
  }

  async function disconnectGoogle() {
    await fetch('/api/integrations/google', { method: 'DELETE' })
    setGoogleStatus({ connected: false })
    setNotification('Google-Verbindung getrennt.')
  }

  async function fetchEmailStatus() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) setEmailStatus(await res.json())
    } catch { /* non-critical */ }
  }

  async function sendTestEmail() {
    setSendingTest(true)
    try {
      const res = await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (res.ok) {
        setNotification('Test-E-Mail wurde gesendet! Überprüfe deinen Posteingang.')
      } else {
        setNotification(data.error || 'Fehler beim Senden')
      }
    } catch {
      setNotification('Fehler beim Senden der Test-E-Mail')
    } finally {
      setSendingTest(false)
    }
  }

  async function fetchPreferences() {
    try {
      const res = await fetch('/api/notifications/preferences')
      if (res.ok) setPrefMatrix(await res.json())
    } catch { /* non-critical */ }
  }

  async function togglePreference(email: string, module: string, currentValue: boolean) {
    const key = `${email}-${module}`
    setTogglingPref(key)
    // Optimistic update
    setPrefMatrix((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          [email]: { ...prev.preferences[email], [module]: !currentValue },
        },
      }
    })
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, module, enabled: !currentValue }),
      })
      if (!res.ok) {
        // Revert on error
        setPrefMatrix((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            preferences: {
              ...prev.preferences,
              [email]: { ...prev.preferences[email], [module]: currentValue },
            },
          }
        })
      }
    } catch {
      // Revert
      setPrefMatrix((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            [email]: { ...prev.preferences[email], [module]: currentValue },
          },
        }
      })
    } finally {
      setTogglingPref(null)
    }
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
    sales: 'bg-purple-500/10 text-purple-500',
    seo: 'bg-green-500/10 text-green-500',
    competitors: 'bg-teal-500/10 text-teal-500',
    social: 'bg-pink-500/10 text-pink-500',
    email: 'bg-blue-500/10 text-blue-500',
    automations: 'bg-amber-500/10 text-amber-500',
    reports: 'bg-indigo-500/10 text-indigo-500',
    system: 'bg-gray-500/10 text-gray-500',
  }

  const hasAwsBedrock = !!(settings.awsAccessKeyId && settings.awsSecretAccessKey)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">API-Keys und Integrationen verwalten</p>
      </div>

      {notification && (
        <div className="p-3 rounded-lg border bg-muted/50 flex items-center justify-between">
          <span className="text-sm">{notification}</span>
          <Button variant="ghost" size="sm" onClick={() => setNotification(null)}>
            <XCircle className="w-4 h-4" />
          </Button>
        </div>
      )}

      <Tabs defaultValue="ai">
        <TabsList>
          <TabsTrigger value="ai">
            <Zap className="w-4 h-4 mr-2" />KI-Provider
          </TabsTrigger>
          <TabsTrigger value="aws">
            <Cloud className="w-4 h-4 mr-2" />AWS Bedrock
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />Benachrichtigungen
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Globe className="w-4 h-4 mr-2" />Integrationen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4 mt-4">
          {/* Anthropic */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="w-5 h-5" />Anthropic Claude
                  </CardTitle>
                  <CardDescription>
                    Strategie, Content, Reports
                    {hasAwsBedrock && (
                      <span className="ml-2 text-blue-500">(Bedrock aktiv)</span>
                    )}
                  </CardDescription>
                </div>
                <Badge className={
                  (settings.anthropicKey || hasAwsBedrock)
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-red-500/10 text-red-500'
                }>
                  {settings.anthropicKey || hasAwsBedrock ? (
                    <><CheckCircle className="w-3 h-3 mr-1" />{hasAwsBedrock ? 'Bedrock' : 'API Key'}</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" />Fehlt</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type={showKeys.anthropic ? 'text' : 'password'}
                  value={settings.anthropicKey}
                  onChange={(e) => setSettings((s) => ({ ...s, anthropicKey: e.target.value }))}
                  placeholder="sk-ant-... (optional wenn Bedrock aktiv)"
                />
                <Button variant="ghost" size="icon" onClick={() => setShowKeys((s) => ({ ...s, anthropic: !s.anthropic }))}>
                  {showKeys.anthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* OpenAI */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="w-5 h-5" />OpenAI GPT-4o
                  </CardTitle>
                  <CardDescription>Daten-Extraktion, Scoring, JSON</CardDescription>
                </div>
                <Badge className={settings.openaiKey ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                  {settings.openaiKey ? <><CheckCircle className="w-3 h-3 mr-1" />Konfiguriert</> : <><XCircle className="w-3 h-3 mr-1" />Fehlt</>}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type={showKeys.openai ? 'text' : 'password'}
                  value={settings.openaiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, openaiKey: e.target.value }))}
                  placeholder="sk-..."
                />
                <Button variant="ghost" size="icon" onClick={() => setShowKeys((s) => ({ ...s, openai: !s.openai }))}>
                  {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gemini */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="w-5 h-5" />Google Gemini 2.0 Flash
                  </CardTitle>
                  <CardDescription>Bild-Analyse, Bulk-Verarbeitung</CardDescription>
                </div>
                <Badge className={settings.geminiKey ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                  {settings.geminiKey ? <><CheckCircle className="w-3 h-3 mr-1" />Konfiguriert</> : <><XCircle className="w-3 h-3 mr-1" />Fehlt</>}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type={showKeys.gemini ? 'text' : 'password'}
                  value={settings.geminiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, geminiKey: e.target.value }))}
                  placeholder="AIza..."
                />
                <Button variant="ghost" size="icon" onClick={() => setShowKeys((s) => ({ ...s, gemini: !s.gemini }))}>
                  {showKeys.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saved ? (
              <><CheckCircle className="w-4 h-4 mr-2" />Gespeichert</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />{saving ? 'Speichern...' : 'API-Keys speichern'}</>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="aws" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cloud className="w-5 h-5" />AWS Bedrock
                  </CardTitle>
                  <CardDescription>
                    Claude über AWS Bedrock nutzen (Alternative zum direkten API-Key).
                    Wenn konfiguriert, wird Bedrock bevorzugt.
                  </CardDescription>
                </div>
                <Badge className={hasAwsBedrock ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}>
                  {hasAwsBedrock ? <><CheckCircle className="w-3 h-3 mr-1" />Aktiv</> : 'Optional'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Access Key ID */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Access Key ID</label>
                <div className="flex gap-2">
                  <Input
                    type={showKeys.awsAccessKey ? 'text' : 'password'}
                    value={settings.awsAccessKeyId}
                    onChange={(e) => setSettings((s) => ({ ...s, awsAccessKeyId: e.target.value }))}
                    placeholder="AKIA..."
                  />
                  <Button variant="ghost" size="icon" onClick={() => setShowKeys((s) => ({ ...s, awsAccessKey: !s.awsAccessKey }))}>
                    {showKeys.awsAccessKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Secret Access Key */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Secret Access Key</label>
                <div className="flex gap-2">
                  <Input
                    type={showKeys.awsSecret ? 'text' : 'password'}
                    value={settings.awsSecretAccessKey}
                    onChange={(e) => setSettings((s) => ({ ...s, awsSecretAccessKey: e.target.value }))}
                    placeholder="Dein AWS Secret Key..."
                  />
                  <Button variant="ghost" size="icon" onClick={() => setShowKeys((s) => ({ ...s, awsSecret: !s.awsSecret }))}>
                    {showKeys.awsSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Region */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Region</label>
                <Input
                  value={settings.awsRegion}
                  onChange={(e) => setSettings((s) => ({ ...s, awsRegion: e.target.value }))}
                  placeholder="eu-central-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  z.B. eu-central-1, us-east-1, eu-west-1
                </p>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">So funktioniert&apos;s:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Bedrock wird bevorzugt wenn konfiguriert</li>
                  <li>Fällt Bedrock aus, wird der direkte Anthropic API-Key genutzt</li>
                  <li>Abrechnung läuft über dein AWS-Konto (pay-per-use)</li>
                  <li>IAM-User braucht <code className="bg-muted px-1 rounded">bedrock:InvokeModel</code> Berechtigung</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saved ? (
              <><CheckCircle className="w-4 h-4 mr-2" />Gespeichert</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />{saving ? 'Speichern...' : 'AWS Bedrock speichern'}</>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5" />E-Mail-Benachrichtigungen
                  </CardTitle>
                  <CardDescription>
                    Interne Benachrichtigungen per E-Mail über Resend
                  </CardDescription>
                </div>
                <Badge className={emailStatus.configured ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                  {emailStatus.configured ? <><CheckCircle className="w-3 h-3 mr-1" />Aktiv</> : <><XCircle className="w-3 h-3 mr-1" />Nicht konfiguriert</>}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">RESEND_API_KEY</p>
                    <p className="text-xs text-muted-foreground">API-Key von resend.com</p>
                  </div>
                  <Badge className={emailStatus.hasApiKey ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                    {emailStatus.hasApiKey ? 'Gesetzt' : 'Fehlt'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">NOTIFICATION_EMAILS</p>
                    <p className="text-xs text-muted-foreground">Kommaseparierte E-Mail-Adressen</p>
                  </div>
                  <Badge className={emailStatus.hasRecipients ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                    {emailStatus.hasRecipients ? `${emailStatus.recipientCount} Empfänger` : 'Fehlt'}
                  </Badge>
                </div>
              </div>

              {!emailStatus.configured && (
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">So richtest du es ein:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Erstelle einen Account auf <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com</a> (kostenlos, 100 Mails/Tag)</li>
                    <li>Kopiere deinen API-Key</li>
                    <li>Füge in <code className="bg-muted px-1 rounded">.env.local</code> hinzu:</li>
                  </ol>
                  <pre className="mt-2 p-2 rounded bg-muted text-xs overflow-x-auto">
{`RESEND_API_KEY=re_xxxxxxxx
NOTIFICATION_EMAILS=du@email.com,kollegin@email.com`}
                  </pre>
                  <p className="mt-2">Auf Vercel: Settings → Environment Variables → beide Werte setzen.</p>
                </div>
              )}

              {emailStatus.configured && (
                <Button onClick={sendTestEmail} disabled={sendingTest}>
                  {sendingTest ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Test-E-Mail senden
                </Button>
              )}

              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">Wann wirst du benachrichtigt:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Neuer Lead erstellt</li>
                  <li>Lead-Score über 80 (Hot Lead)</li>
                  <li>Wettbewerber-Analyse abgeschlossen</li>
                  <li>Wochenbericht generiert</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {prefMatrix && prefMatrix.emails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modul-Benachrichtigungen</CardTitle>
                <CardDescription>Steuere pro Modul, wer Benachrichtigungen erhält</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Modul</th>
                        {prefMatrix.emails.map((email) => (
                          <th key={email} className="text-center py-2 px-2 font-medium text-muted-foreground">
                            <span className="text-xs">{email.split('@')[0]}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {prefMatrix.modules.map((mod) => (
                        <tr key={mod} className="border-b border-border/50">
                          <td className="py-2 pr-4">
                            <Badge variant="secondary" className={moduleColors[mod] || ''}>
                              {moduleLabels[mod] || mod}
                            </Badge>
                          </td>
                          {prefMatrix.emails.map((email) => {
                            const enabled = prefMatrix.preferences[email]?.[mod] ?? true
                            const key = `${email}-${mod}`
                            return (
                              <td key={email} className="text-center py-2 px-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={togglingPref === key}
                                  onClick={() => togglePreference(email, mod, enabled)}
                                  className={cn(
                                    'w-8 h-8 rounded-full p-0',
                                    enabled
                                      ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                  )}
                                >
                                  {enabled ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                </Button>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 mt-4">
          {/* Google */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Google (Ads + Search Console + GA4)</CardTitle>
                  <CardDescription>Einmaliger OAuth-Flow für alle Google-Dienste</CardDescription>
                </div>
                <Badge className={googleStatus.connected ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                  {googleStatus.connected ? <><CheckCircle className="w-3 h-3 mr-1" />Verbunden</> : <><XCircle className="w-3 h-3 mr-1" />Nicht verbunden</>}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {googleStatus.connected ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{googleStatus.accountName}</p>
                    <p className="text-xs text-muted-foreground">Search Console + GA4 + Ads</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={disconnectGoogle}>
                    <Unlink className="w-4 h-4 mr-2" />Trennen
                  </Button>
                </div>
              ) : (
                <Button onClick={connectGoogle} disabled={connectingGoogle}>
                  {connectingGoogle ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4 mr-2" />
                  )}
                  Google verbinden
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardHeader>
              <CardTitle>Meta (Facebook & Instagram Ads)</CardTitle>
              <CardDescription>Meta Business Suite OAuth-Verbindung</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled>
                <Globe className="w-4 h-4 mr-2" />Meta verbinden (Phase 4)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
