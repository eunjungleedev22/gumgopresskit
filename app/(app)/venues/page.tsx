'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateFitScore, GENRES, VENUE_TYPES } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FitScoreBadge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Plus, Mail, Globe } from 'lucide-react'
import type { Venue, Profile, VenueFitResult, PipelineStage } from '@/types'
import { PIPELINE_STAGES } from '@/lib/utils'

export default function VenuesPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [results, setResults] = useState<VenueFitResult[]>([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState<Venue | null>(null)
  const [addStage, setAddStage] = useState<PipelineStage>('wishlist')
  const [addLoading, setAddLoading] = useState(false)
  const [added, setAdded] = useState<Set<string>>(new Set())

  const [filters, setFilters] = useState({
    city: '',
    genre: '',
    type: '',
    capacity: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: v }, { data: p }, { data: existingCampaigns }] = await Promise.all([
        supabase.from('venues').select('*').order('name'),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('campaigns').select('venue_id').eq('user_id', user.id),
      ])

      const venueList = (v ?? []) as Venue[]
      const prof = p as Profile | null
      setProfile(prof)

      const existingIds = new Set((existingCampaigns ?? []).map((c: {venue_id: string}) => c.venue_id))
      setAdded(existingIds as Set<string>)

      if (prof) {
        const scored = venueList
          .map(venue => calculateFitScore(venue, prof))
          .sort((a, b) => b.score - a.score)
        setResults(scored)
      } else {
        setResults(venueList.map(v => ({ venue: v, score: 0, reason: 'Complete your profile to see fit scores.', highlights: [] })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = results.filter(r => {
    const v = r.venue
    if (filters.city && !v.city.toLowerCase().includes(filters.city.toLowerCase())) return false
    if (filters.genre && !v.genres.some(g => g.toLowerCase().includes(filters.genre.toLowerCase()))) return false
    if (filters.type && v.venue_type !== filters.type) return false
    if (filters.capacity) {
      const cap = parseInt(filters.capacity)
      if (!isNaN(cap) && v.capacity && v.capacity > cap) return false
    }
    return true
  })

  async function addToCRM() {
    if (!addModal) return
    setAddLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fitResult = profile ? calculateFitScore(addModal, profile) : null

    await supabase.from('campaigns').insert({
      user_id: user.id,
      venue_id: addModal.id,
      stage: addStage,
      contact_name: addModal.contact_name,
      contact_email: addModal.booking_email,
      fit_score: fitResult?.score ?? null,
      fit_reason: fitResult?.reason ?? null,
      probability: 0,
    })

    setAdded(prev => new Set([...prev, addModal.id]))
    setAddModal(null)
    setAddLoading(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-2xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Discovery</p>
        <h1 className="text-2xl font-semibold tracking-tight">Venues</h1>
        <p className="text-sm text-zinc-400 mt-1">
          {profile ? `Showing fit scores for ${profile.dj_name ?? 'your profile'}.` : 'Complete your profile to see personalised fit scores.'}
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
        <Input
          placeholder="City..."
          value={filters.city}
          onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
        />
        <Select
          options={GENRES.slice(0, 15).map(g => ({ value: g, label: g }))}
          placeholder="Genre..."
          value={filters.genre}
          onChange={e => setFilters(f => ({ ...f, genre: e.target.value }))}
        />
        <Select
          options={VENUE_TYPES}
          placeholder="Type..."
          value={filters.type}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
        />
        <Select
          options={[
            { value: '300', label: '< 300 cap' },
            { value: '600', label: '< 600 cap' },
            { value: '1000', label: '< 1000 cap' },
            { value: '2000', label: 'Any size' },
          ]}
          placeholder="Capacity..."
          value={filters.capacity}
          onChange={e => setFilters(f => ({ ...f, capacity: e.target.value }))}
        />
      </div>

      {/* Count */}
      <p className="text-xs text-zinc-500">
        {loading ? 'Loading...' : `${filtered.length} venue${filtered.length !== 1 ? 's' : ''}`}
        {(filters.city || filters.genre || filters.type || filters.capacity) && ' (filtered)'}
      </p>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(r => (
          <VenueCard
            key={r.venue.id}
            result={r}
            isAdded={added.has(r.venue.id)}
            onAdd={() => setAddModal(r.venue)}
          />
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16">
          <p className="text-zinc-500 text-sm">No venues match your filters.</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => setFilters({ city: '', genre: '', type: '', capacity: '' })}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Add to CRM modal */}
      <Modal
        open={!!addModal}
        onClose={() => setAddModal(null)}
        title={`Add ${addModal?.name} to CRM`}
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Add this venue to your pipeline. Pick the starting stage.
          </p>
          <Select
            label="Starting stage"
            options={PIPELINE_STAGES.map(s => ({ value: s.value, label: s.label }))}
            value={addStage}
            onChange={e => setAddStage(e.target.value as PipelineStage)}
          />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setAddModal(null)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={addToCRM} loading={addLoading}>
              Add to CRM
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function VenueCard({
  result,
  isAdded,
  onAdd,
}: {
  result: VenueFitResult
  isAdded: boolean
  onAdd: () => void
}) {
  const { venue, score, reason, highlights } = result
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-medium text-zinc-100 truncate">{venue.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {venue.city}{venue.country ? `, ${venue.country}` : ''}
            {venue.capacity ? ` · ${venue.capacity.toLocaleString()} cap` : ''}
            {venue.venue_type ? ` · ${venue.venue_type}` : ''}
          </p>
        </div>
        <FitScoreBadge score={score} className="shrink-0" />
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed mb-3">{reason}</p>

      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {highlights.map(h => (
            <span key={h} className="text-2xs font-mono text-zinc-500 border border-zinc-800 rounded px-2 py-0.5">
              {h}
            </span>
          ))}
        </div>
      )}

      {venue.genres.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {venue.genres.slice(0, 4).map(g => (
            <span key={g} className="text-2xs text-zinc-600 border border-zinc-800/60 rounded px-1.5 py-0.5">
              {g}
            </span>
          ))}
        </div>
      )}

      {expanded && (
        <div className="border-t border-zinc-800/60 pt-3 mb-3 space-y-2">
          {venue.booking_email && (
            <a
              href={`mailto:${venue.booking_email}`}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              {venue.booking_email}
            </a>
          )}
          {venue.website && (
            <a
              href={`https://${venue.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {venue.website}
            </a>
          )}
          {venue.recent_lineups.length > 0 && (
            <div>
              <p className="text-2xs text-zinc-600 mb-1 uppercase tracking-wide font-mono">Recent lineups</p>
              <p className="text-xs text-zinc-400">{venue.recent_lineups.join(', ')}</p>
            </div>
          )}
          {venue.notes && (
            <p className="text-xs text-zinc-500 italic">{venue.notes}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(e => !e)}
          className="text-xs"
        >
          {expanded ? 'Less' : 'Details'}
        </Button>
        <div className="flex-1" />
        {isAdded ? (
          <span className="text-xs text-zinc-600 font-mono">In CRM</span>
        ) : (
          <Button size="sm" variant="secondary" onClick={onAdd}>
            <Plus className="w-3.5 h-3.5" />
            Add to CRM
          </Button>
        )}
      </div>
    </div>
  )
}
