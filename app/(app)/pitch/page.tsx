'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Copy, Check, Sparkles, AlertCircle } from 'lucide-react'
import type { Profile, Venue, GeneratedPitch } from '@/types'

type Tab = 'email' | 'dm' | 'intro'
type Tone = 'warm' | 'professional' | 'casual'

export default function PitchPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenueId, setSelectedVenueId] = useState('')
  const [manualVenue, setManualVenue] = useState('')
  const [manualCity, setManualCity] = useState('')
  const [tourDates, setTourDates] = useState('')
  const [tone, setTone] = useState<Tone>('warm')
  const [context, setContext] = useState('')
  const [result, setResult] = useState<GeneratedPitch | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('email')
  const [copied, setCopied] = useState(false)
  const [useExistingVenue, setUseExistingVenue] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: v }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('venues').select('*').order('name'),
      ])
      setProfile(p as Profile | null)
      setVenues((v ?? []) as Venue[])
    }
    load()
  }, [])

  const selectedVenue = venues.find(v => v.id === selectedVenueId)

  async function generate() {
    setError('')
    setLoading(true)
    setResult(null)

    const venueName = useExistingVenue ? (selectedVenue?.name ?? '') : manualVenue
    const venueCity = useExistingVenue ? (selectedVenue?.city ?? '') : manualCity
    const venueGenres = useExistingVenue ? (selectedVenue?.genres ?? []) : []

    if (!venueName) {
      setError('Please select or enter a venue.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_name: venueName,
          venue_city: venueCity,
          venue_genres: venueGenres,
          dj_name: profile?.dj_name ?? 'Artist',
          dj_genres: profile?.genres ?? [],
          bpm_range: profile?.bpm_min && profile?.bpm_max
            ? `${profile.bpm_min}–${profile.bpm_max} BPM`
            : 'not specified',
          soundcloud_url: profile?.soundcloud_url ?? undefined,
          tour_dates: tourDates || undefined,
          tone,
          additional_context: context || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Generation failed')
      }

      const data = await res.json()
      setResult(data)
      setActiveTab('email')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    if (!result) return
    const text = result[activeTab]
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function saveToMessages() {
    if (!result) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // If venue is in CRM, link it
    if (selectedVenueId) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user.id)
        .eq('venue_id', selectedVenueId)
        .single()

      if (campaign) {
        await supabase.from('messages').insert({
          campaign_id: campaign.id,
          user_id: user.id,
          message_type: activeTab,
          content: result[activeTab],
        })
      }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-2xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Generator</p>
        <h1 className="text-2xl font-semibold tracking-tight">Pitch</h1>
        <p className="text-sm text-zinc-400 mt-1">
          AI-written outreach for emails, DMs, and intros. Warm, human, no filler.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-2">Venue</p>
            <div className="flex gap-2 mb-3">
              <Button
                size="sm"
                variant={useExistingVenue ? 'secondary' : 'ghost'}
                onClick={() => setUseExistingVenue(true)}
              >
                From database
              </Button>
              <Button
                size="sm"
                variant={!useExistingVenue ? 'secondary' : 'ghost'}
                onClick={() => setUseExistingVenue(false)}
              >
                Enter manually
              </Button>
            </div>

            {useExistingVenue ? (
              <Select
                options={venues.map(v => ({ value: v.id, label: `${v.name} — ${v.city}` }))}
                placeholder="Select venue..."
                value={selectedVenueId}
                onChange={e => setSelectedVenueId(e.target.value)}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Venue name"
                  value={manualVenue}
                  onChange={e => setManualVenue(e.target.value)}
                />
                <Input
                  placeholder="City"
                  value={manualCity}
                  onChange={e => setManualCity(e.target.value)}
                />
              </div>
            )}
          </div>

          <Select
            label="Tone"
            options={[
              { value: 'warm', label: 'Warm — personal, slightly informal' },
              { value: 'professional', label: 'Professional — clear and direct' },
              { value: 'casual', label: 'Casual — like a DM from a friend' },
            ]}
            value={tone}
            onChange={e => setTone(e.target.value as Tone)}
          />

          <Input
            label="Tour dates (optional)"
            placeholder="e.g. Berlin 12 Jan, Amsterdam 14 Jan"
            value={tourDates}
            onChange={e => setTourDates(e.target.value)}
          />

          <Textarea
            label="Additional context (optional)"
            placeholder="Recent releases, radio features, shared connections..."
            rows={3}
            value={context}
            onChange={e => setContext(e.target.value)}
          />

          {/* Profile preview */}
          {profile && (
            <div className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/30">
              <p className="text-2xs font-mono text-zinc-600 uppercase tracking-widest mb-2">Your profile</p>
              <div className="space-y-1">
                <p className="text-xs text-zinc-400"><span className="text-zinc-600">Artist:</span> {profile.dj_name ?? '—'}</p>
                <p className="text-xs text-zinc-400"><span className="text-zinc-600">Genres:</span> {profile.genres?.join(', ') || '—'}</p>
                <p className="text-xs text-zinc-400"><span className="text-zinc-600">BPM:</span> {profile.bpm_min && profile.bpm_max ? `${profile.bpm_min}–${profile.bpm_max}` : '—'}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-md px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <Button variant="primary" className="w-full" onClick={generate} loading={loading}>
            <Sparkles className="w-4 h-4" />
            Generate pitch
          </Button>
        </div>

        {/* Output */}
        <div>
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-1 border border-zinc-800 rounded-lg overflow-hidden">
                  {(['email', 'dm', 'intro'] as Tab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium transition-colors',
                        activeTab === tab
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-500 hover:text-zinc-300'
                      )}
                    >
                      {tab === 'email' ? 'Email' : tab === 'dm' ? 'Instagram DM' : 'Short intro'}
                    </button>
                  ))}
                </div>
                <Button size="sm" variant="ghost" onClick={copy}>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>

              <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/30 min-h-[200px]">
                <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {result[activeTab]}
                </pre>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={saveToMessages} className="text-xs">
                  Save to CRM
                </Button>
                <Button size="sm" variant="ghost" onClick={generate} loading={loading} className="text-xs">
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-zinc-800 rounded-xl h-full min-h-[300px] flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-600">Your pitch appears here.</p>
                <p className="text-xs text-zinc-700 mt-1">Fill in the form and generate.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
