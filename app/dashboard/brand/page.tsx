'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, X, Plus, Info } from 'lucide-react'
import { useToast } from '../components/toast'

interface BrandProfile {
  brandName: string
  slogan: string
  description: string
  targetAudience: string
  brandValues: string[]
  tonality: string
  colors: { primary: string; secondary: string; accent: string }
  industry: string
  primaryLanguage: string
  secondaryLanguage: string
  aiContext: string
}

const defaultBrand: BrandProfile = {
  brandName: '',
  slogan: '',
  description: '',
  targetAudience: '',
  brandValues: [],
  tonality: 'professional',
  colors: { primary: '#10b981', secondary: '#065f46', accent: '#d4a574' },
  industry: '',
  primaryLanguage: 'de',
  secondaryLanguage: '',
  aiContext: '',
}

const tonalityOptions = [
  { value: 'professional', label: 'Professionell' },
  { value: 'casual', label: 'Locker & Freundlich' },
  { value: 'luxurious', label: 'Luxuriös & Premium' },
  { value: 'playful', label: 'Verspielt & Jung' },
  { value: 'scientific', label: 'Wissenschaftlich & Sachlich' },
  { value: 'emotional', label: 'Emotional & Inspirierend' },
]

const languageOptions = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'Englisch' },
  { value: 'fr', label: 'Französisch' },
  { value: 'es', label: 'Spanisch' },
  { value: 'it', label: 'Italienisch' },
]

export default function BrandPage() {
  const [brand, setBrand] = useState<BrandProfile>(defaultBrand)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newValue, setNewValue] = useState('')
  const { toast } = useToast()

  useEffect(() => { fetchBrand() }, [])

  async function fetchBrand() {
    try {
      const res = await fetch('/api/brand')
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setBrand({
            brandName: data.brandName || '',
            slogan: data.slogan || '',
            description: data.description || '',
            targetAudience: data.targetAudience || '',
            brandValues: data.brandValues || [],
            tonality: data.tonality || 'professional',
            colors: data.colors || defaultBrand.colors,
            industry: data.industry || '',
            primaryLanguage: data.primaryLanguage || 'de',
            secondaryLanguage: data.secondaryLanguage || '',
            aiContext: data.aiContext || '',
          })
        }
      }
    } catch {
      toast('Markenprofil konnte nicht geladen werden.', 'error')
    } finally { setLoading(false) }
  }

  async function saveBrand() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/brand', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...brand,
          brandValues: brand.brandValues.length > 0 ? brand.brandValues : null,
          slogan: brand.slogan || null,
          description: brand.description || null,
          targetAudience: brand.targetAudience || null,
          industry: brand.industry || null,
          secondaryLanguage: brand.secondaryLanguage || null,
          aiContext: brand.aiContext || null,
        }),
      })
      if (res.ok) {
        setSaved(true)
        toast('Markenprofil gespeichert!', 'success')
      } else {
        toast('Markenprofil konnte nicht gespeichert werden.', 'error')
      }
    } catch {
      toast('Verbindungsfehler.', 'error')
    } finally { setSaving(false) }
  }

  function addValue() {
    const v = newValue.trim()
    if (v && !brand.brandValues.includes(v)) {
      setBrand({ ...brand, brandValues: [...brand.brandValues, v] })
      setNewValue('')
    }
  }

  function removeValue(val: string) {
    setBrand({ ...brand, brandValues: brand.brandValues.filter((v) => v !== val) })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Marken-Kit</h1>
        <p className="text-muted-foreground mt-1">Definiere deine Markenidentität für konsistente KI-Content-Generierung</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-lg text-sm">
          <Save className="w-4 h-4" /> Markenprofil gespeichert
        </div>
      )}

      {/* Grunddaten */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Grunddaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brandName">Markenname *</Label>
              <Input
                id="brandName"
                value={brand.brandName}
                onChange={(e) => setBrand({ ...brand, brandName: e.target.value })}
                placeholder="z.B. Matcha Mio"
              />
            </div>
            <div>
              <Label htmlFor="industry">Branche</Label>
              <Input
                id="industry"
                value={brand.industry}
                onChange={(e) => setBrand({ ...brand, industry: e.target.value })}
                placeholder="z.B. Food & Beverage, Matcha"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="slogan">Slogan</Label>
            <Input
              id="slogan"
              value={brand.slogan}
              onChange={(e) => setBrand({ ...brand, slogan: e.target.value })}
              placeholder="z.B. Dein täglicher Matcha-Moment"
            />
          </div>
          <div>
            <Label htmlFor="description">Markenbeschreibung</Label>
            <Textarea
              id="description"
              value={brand.description}
              onChange={(e) => setBrand({ ...brand, description: e.target.value })}
              rows={3}
              placeholder="Beschreibe deine Marke, Mission und was euch besonders macht..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Zielgruppe & Werte */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Zielgruppe & Werte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="targetAudience">Zielgruppe</Label>
            <Textarea
              id="targetAudience"
              value={brand.targetAudience}
              onChange={(e) => setBrand({ ...brand, targetAudience: e.target.value })}
              rows={2}
              placeholder="z.B. Gesundheitsbewusste 25-40-Jährige, die Wert auf Qualität und Nachhaltigkeit legen"
            />
          </div>
          <div>
            <Label>Markenwerte</Label>
            <div className="flex flex-wrap gap-2 mt-1 mb-2">
              {brand.brandValues.map((val) => (
                <Badge key={val} variant="secondary" className="gap-1 pr-1">
                  {val}
                  <button onClick={() => removeValue(val)} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Neuen Wert hinzufügen..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addValue}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="tonality">Tonalität</Label>
            <select
              id="tonality"
              value={brand.tonality}
              onChange={(e) => setBrand({ ...brand, tonality: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {tonalityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Farben */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Markenfarben</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {(['primary', 'secondary', 'accent'] as const).map((key) => (
              <div key={key}>
                <Label htmlFor={`color-${key}`} className="capitalize">{key === 'primary' ? 'Primär' : key === 'secondary' ? 'Sekundär' : 'Akzent'}</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    id={`color-${key}`}
                    value={brand.colors[key]}
                    onChange={(e) => setBrand({ ...brand, colors: { ...brand.colors, [key]: e.target.value } })}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={brand.colors[key]}
                    onChange={(e) => setBrand({ ...brand, colors: { ...brand.colors, [key]: e.target.value } })}
                    className="font-mono text-sm"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sprache */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sprache</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryLanguage">Hauptsprache</Label>
              <select
                id="primaryLanguage"
                value={brand.primaryLanguage}
                onChange={(e) => setBrand({ ...brand, primaryLanguage: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {languageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="secondaryLanguage">Zweitsprache (optional)</Label>
              <select
                id="secondaryLanguage"
                value={brand.secondaryLanguage}
                onChange={(e) => setBrand({ ...brand, secondaryLanguage: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Keine</option>
                {languageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KI-Kontext */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">KI-Kontext</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>Dieser Text wird allen KI-Generierungen vorangestellt. Nutze ihn für spezifische Anweisungen zu Stil, Do&apos;s und Don&apos;ts, oder Produktdetails.</p>
          </div>
          <Textarea
            id="aiContext"
            value={brand.aiContext}
            onChange={(e) => setBrand({ ...brand, aiContext: e.target.value })}
            rows={5}
            placeholder="z.B. Verwende immer 'Du' statt 'Sie'. Erwähne die japanische Herkunft. Betone Bio-Qualität und zeremonielle Güte..."
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveBrand} disabled={saving || !brand.brandName} size="lg">
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Speichert...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />Markenprofil speichern</>
          )}
        </Button>
      </div>
    </div>
  )
}
