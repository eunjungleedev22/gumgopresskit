'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GENRES } from '@/lib/utils'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
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

  async function handleSubmit() {
    setLoading(true)
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

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="flex gap-1.5 mb-6">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className={`h-0.5 flex-1 rounded-full ${n <= step ? 'bg-zinc-200' : 'bg-zinc-800'}`}
              />
            ))}
          </div>
          <p className="text-2xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Step {step} of 3</p>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight mb-1">Your artist profile</h1>
              <p className="text-sm text-zinc-400">This shapes your venue fit scores and pitch generation.</p>
            </div>
            <Input
              label="DJ / Artist name"
              value={form.dj_name}
              onChange={e => update('dj_name', e.target.value)}
              placeholder="e.g. Orpheu The Wizard"
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
            <Button variant="primary" className="w-full" onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight mb-1">Your genres</h1>
              <p className="text-sm text-zinc-400">Select all that apply. Used to calculate venue fit.</p>
            </div>
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
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" className="flex-1" onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight mb-1">Location & links</h1>
              <p className="text-sm text-zinc-400">Used to prioritise local venues and build your pitch.</p>
            </div>
            <Input
              label="Home city"
              value={form.home_city}
              onChange={e => update('home_city', e.target.value)}
              placeholder="e.g. Amsterdam"
            />
            <Input
              label="Touring regions (comma-separated)"
              value={form.touring_regions}
              onChange={e => update('touring_regions', e.target.value)}
              placeholder="e.g. Berlin, London, Paris"
            />
            <Input
              label="SoundCloud URL"
              type="url"
              value={form.soundcloud_url}
              onChange={e => update('soundcloud_url', e.target.value)}
              placeholder="https://soundcloud.com/yourname"
            />
            <Input
              label="Resident Advisor URL"
              type="url"
              value={form.resident_advisor_url}
              onChange={e => update('resident_advisor_url', e.target.value)}
              placeholder="https://ra.co/dj/yourname"
            />
            <Input
              label="EPK URL (optional)"
              type="url"
              value={form.epk_url}
              onChange={e => update('epk_url', e.target.value)}
              placeholder="https://yoursite.com/epk"
            />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button variant="primary" className="flex-1" onClick={handleSubmit} loading={loading}>
                Finish setup
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
