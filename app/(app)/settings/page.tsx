'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GENRES } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { Profile } from '@/types'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    dj_name: '',
    genres: [] as string[],
    bpm_min: '',
    bpm_max: '',
    home_city: '',
    touring_regions: '',
    epk_url: '',
    soundcloud_url: '',
    resident_advisor_url: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const prof = p as Profile | null
      if (prof) {
        setForm({
          dj_name: prof.dj_name ?? '',
          genres: prof.genres ?? [],
          bpm_min: prof.bpm_min?.toString() ?? '',
          bpm_max: prof.bpm_max?.toString() ?? '',
          home_city: prof.home_city ?? '',
          touring_regions: (prof.touring_regions ?? []).join(', '),
          epk_url: prof.epk_url ?? '',
          soundcloud_url: prof.soundcloud_url ?? '',
          resident_advisor_url: prof.resident_advisor_url ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function toggleGenre(genre: string) {
    setForm(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre],
    }))
  }

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').upsert({
      id: user.id,
      dj_name: form.dj_name || null,
      genres: form.genres,
      bpm_min: form.bpm_min ? parseInt(form.bpm_min) : null,
      bpm_max: form.bpm_max ? parseInt(form.bpm_max) : null,
      home_city: form.home_city || null,
      touring_regions: form.touring_regions
        ? form.touring_regions.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      epk_url: form.epk_url || null,
      soundcloud_url: form.soundcloud_url || null,
      resident_advisor_url: form.resident_advisor_url || null,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <p className="text-2xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Account</p>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <section className="space-y-5">
        <h2 className="text-sm font-medium text-zinc-300 pb-3 border-b border-zinc-800">Artist profile</h2>
        <Input
          label="DJ / Artist name"
          value={form.dj_name}
          onChange={e => update('dj_name', e.target.value)}
          placeholder="Your alias"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="BPM min"
            type="number"
            value={form.bpm_min}
            onChange={e => update('bpm_min', e.target.value)}
            placeholder="120"
          />
          <Input
            label="BPM max"
            type="number"
            value={form.bpm_max}
            onChange={e => update('bpm_max', e.target.value)}
            placeholder="145"
          />
        </div>
        <Input
          label="Home city"
          value={form.home_city}
          onChange={e => update('home_city', e.target.value)}
          placeholder="Amsterdam"
        />
        <Input
          label="Touring regions (comma-separated)"
          value={form.touring_regions}
          onChange={e => update('touring_regions', e.target.value)}
          placeholder="Berlin, London, Paris"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-zinc-300 pb-3 border-b border-zinc-800">Genres</h2>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className={`text-xs font-mono px-3 py-1.5 rounded-md border transition-colors ${
                form.genres.includes(g)
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                  : 'text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-zinc-300 pb-3 border-b border-zinc-800">Links</h2>
        <Input
          label="SoundCloud"
          type="url"
          value={form.soundcloud_url}
          onChange={e => update('soundcloud_url', e.target.value)}
          placeholder="https://soundcloud.com/yourname"
        />
        <Input
          label="Resident Advisor"
          type="url"
          value={form.resident_advisor_url}
          onChange={e => update('resident_advisor_url', e.target.value)}
          placeholder="https://ra.co/dj/yourname"
        />
        <Input
          label="EPK URL"
          type="url"
          value={form.epk_url}
          onChange={e => update('epk_url', e.target.value)}
          placeholder="https://yoursite.com/epk"
        />
      </section>

      <div className="flex items-center gap-3 pt-2">
        <Button variant="primary" onClick={save} loading={saving}>
          {saved ? <Check className="w-4 h-4 text-emerald-400" /> : null}
          {saved ? 'Saved' : 'Save changes'}
        </Button>
        {saved && <p className="text-xs text-emerald-400">Profile updated.</p>}
      </div>
    </div>
  )
}
