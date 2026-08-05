'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Eye, EyeOff, CheckCircle, XCircle, Key, Globe, Zap } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    anthropicKey: '',
    openaiKey: '',
    geminiKey: '',
  })
  const [showKeys, setShowKeys] = useState({
    anthropic: false,
    openai: false,
    gemini: false,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings({
          anthropicKey: data.anthropicKey || '',
          openaiKey: data.openaiKey || '',
          geminiKey: data.geminiKey || '',
        })
      }
    } catch {
      // ignore
    }
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
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground mt-1">API-Keys und Integrationen verwalten</p>
      </div>

      <Tabs defaultValue="ai">
        <TabsList>
          <TabsTrigger value="ai">
            <Zap className="w-4 h-4 mr-2" />KI-Provider
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Globe className="w-4 h-4 mr-2" />Integrationen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4 mt-4">
          {/* Anthropic Claude */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Anthropic Claude
                  </CardTitle>
                  <CardDescription>Strategie, Content, Reports</CardDescription>
                </div>
                <Badge className={settings.anthropicKey ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                  {settings.anthropicKey ? <><CheckCircle className="w-3 h-3 mr-1" />Konfiguriert</> : <><XCircle className="w-3 h-3 mr-1" />Fehlt</>}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type={showKeys.anthropic ? 'text' : 'password'}
                  value={settings.anthropicKey}
                  onChange={(e) => setSettings((s) => ({ ...s, anthropicKey: e.target.value }))}
                  placeholder="sk-ant-..."
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowKeys((s) => ({ ...s, anthropic: !s.anthropic }))}
                >
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
                    <Key className="w-5 h-5" />
                    OpenAI GPT-4o
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowKeys((s) => ({ ...s, openai: !s.openai }))}
                >
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
                    <Key className="w-5 h-5" />
                    Google Gemini 2.0 Flash
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowKeys((s) => ({ ...s, gemini: !s.gemini }))}
                >
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

        <TabsContent value="integrations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Google (Ads + Search Console + GA4)</CardTitle>
              <CardDescription>
                Einmaliger OAuth-Flow für alle Google-Dienste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled>
                <Globe className="w-4 h-4 mr-2" />Google verbinden (Phase 3)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meta (Facebook & Instagram Ads)</CardTitle>
              <CardDescription>
                Meta Business Suite OAuth-Verbindung
              </CardDescription>
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
