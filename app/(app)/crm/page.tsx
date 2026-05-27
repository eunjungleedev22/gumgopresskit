'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PIPELINE_STAGES, getStageMeta, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { StageBadge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Columns3, List, Plus, ChevronRight, Trash2, ExternalLink } from 'lucide-react'
import type { Campaign, PipelineStage, Venue } from '@/types'

type View = 'kanban' | 'table'

export default function CRMPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('kanban')
  const [selected, setSelected] = useState<Campaign | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: c }, { data: v }] = await Promise.all([
      supabase.from('campaigns').select('*, venue:venues(*)').eq('user_id', user.id).order('updated_at', { ascending: false }),
      supabase.from('venues').select('*').order('name'),
    ])
    setCampaigns((c ?? []) as Campaign[])
    setVenues((v ?? []) as Venue[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function updateStage(id: string, stage: PipelineStage) {
    const supabase = createClient()
    await supabase.from('campaigns').update({ stage, updated_at: new Date().toISOString() }).eq('id', id)
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, stage } : c))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, stage } : null)
  }

  async function updateCampaign(id: string, updates: Partial<Campaign>) {
    const supabase = createClient()
    await supabase.from('campaigns').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...updates } : null)
  }

  async function deleteCampaign(id: string) {
    const supabase = createClient()
    await supabase.from('campaigns').delete().eq('id', id)
    setCampaigns(prev => prev.filter(c => c.id !== id))
    setSelected(null)
  }

  const byStageCounts = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s.value] = campaigns.filter(c => c.stage === s.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Pipeline</p>
          <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
          <p className="text-sm text-zinc-400 mt-1">{campaigns.length} leads across {Object.values(byStageCounts).filter(Boolean).length} stages</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-zinc-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('kanban')}
              className={cn('p-2 text-xs transition-colors', view === 'kanban' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}
            >
              <Columns3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('table')}
              className={cn('p-2 text-xs transition-colors', view === 'table' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add lead
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : view === 'kanban' ? (
        <KanbanView campaigns={campaigns} onSelect={setSelected} />
      ) : (
        <TableView campaigns={campaigns} onSelect={setSelected} />
      )}

      {/* Detail modal */}
      {selected && (
        <CampaignModal
          campaign={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateCampaign}
          onDelete={deleteCampaign}
          onStageChange={updateStage}
        />
      )}

      {/* Add lead modal */}
      {addOpen && (
        <AddLeadModal
          venues={venues}
          onClose={() => setAddOpen(false)}
          onAdded={() => { setAddOpen(false); load() }}
        />
      )}
    </div>
  )
}

function KanbanView({
  campaigns,
  onSelect,
}: {
  campaigns: Campaign[]
  onSelect: (c: Campaign) => void
}) {
  const visibleStages = PIPELINE_STAGES.slice(0, 6)

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {visibleStages.map(s => {
          const cards = campaigns.filter(c => c.stage === s.value)
          return (
            <div key={s.value} className="w-64 shrink-0">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className={`text-xs font-mono ${s.color.split(' ')[0]}`}>{s.label}</span>
                <span className="text-xs text-zinc-600 tabular-nums">{cards.length}</span>
              </div>
              <div className="space-y-2">
                {cards.map(c => (
                  <KanbanCard key={c.id} campaign={c} onClick={() => onSelect(c)} />
                ))}
                {cards.length === 0 && (
                  <div className="border border-dashed border-zinc-800 rounded-lg h-16" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KanbanCard({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-zinc-800 rounded-lg p-3.5 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-zinc-100 leading-tight line-clamp-1">
          {campaign.venue?.name ?? 'Unknown venue'}
        </p>
        {campaign.fit_score != null && (
          <span className="text-2xs font-mono text-zinc-500 shrink-0">{campaign.fit_score}</span>
        )}
      </div>
      <p className="text-xs text-zinc-500 mb-2">{campaign.venue?.city ?? '—'}</p>
      {campaign.notes && (
        <p className="text-xs text-zinc-600 line-clamp-2 mb-2">{campaign.notes}</p>
      )}
      <div className="flex items-center justify-between">
        {campaign.probability > 0 ? (
          <span className="text-2xs text-zinc-600 font-mono">{campaign.probability}%</span>
        ) : (
          <span />
        )}
        {campaign.next_followup_at && (
          <span className="text-2xs text-zinc-600">
            {formatDate(campaign.next_followup_at)}
          </span>
        )}
      </div>
    </button>
  )
}

function TableView({ campaigns, onSelect }: { campaigns: Campaign[]; onSelect: (c: Campaign) => void }) {
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/40">
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Venue</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Stage</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Last outreach</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Follow-up</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Fit</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">P(%)</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c, i) => (
            <tr
              key={c.id}
              className={`border-b border-zinc-800/50 hover:bg-zinc-900/30 cursor-pointer transition-colors ${i === campaigns.length - 1 ? 'border-0' : ''}`}
              onClick={() => onSelect(c)}
            >
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-100">{c.venue?.name ?? '—'}</p>
                <p className="text-xs text-zinc-500">{c.venue?.city ?? '—'}</p>
              </td>
              <td className="px-4 py-3">
                <StageBadge stage={c.stage} />
              </td>
              <td className="px-4 py-3 text-xs text-zinc-400">{formatDate(c.last_outreach_at)}</td>
              <td className="px-4 py-3 text-xs text-zinc-400">{formatDate(c.next_followup_at)}</td>
              <td className="px-4 py-3 text-xs font-mono text-zinc-400">{c.fit_score ?? '—'}</td>
              <td className="px-4 py-3 text-xs font-mono text-zinc-400">{c.probability > 0 ? `${c.probability}%` : '—'}</td>
              <td className="px-4 py-3">
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-zinc-600">No leads yet. Add venues from the Discovery page.</p>
        </div>
      )}
    </div>
  )
}

function CampaignModal({
  campaign,
  onClose,
  onUpdate,
  onDelete,
  onStageChange,
}: {
  campaign: Campaign
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Campaign>) => void
  onDelete: (id: string) => void
  onStageChange: (id: string, stage: PipelineStage) => void
}) {
  const [notes, setNotes] = useState(campaign.notes ?? '')
  const [followup, setFollowup] = useState(campaign.next_followup_at?.split('T')[0] ?? '')
  const [probability, setProbability] = useState(campaign.probability.toString())
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await onUpdate(campaign.id, {
      notes: notes || null,
      next_followup_at: followup ? `${followup}T00:00:00Z` : null,
      probability: parseInt(probability) || 0,
    })
    setSaving(false)
  }

  const nextStages = PIPELINE_STAGES.filter(s => s.value !== campaign.stage)

  return (
    <Modal open onClose={onClose} title={campaign.venue?.name ?? 'Lead detail'} className="max-w-lg">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <StageBadge stage={campaign.stage} />
          <span className="text-xs text-zinc-500">{campaign.venue?.city}</span>
          {campaign.fit_score != null && (
            <span className="text-xs font-mono text-zinc-500 ml-auto">Fit: {campaign.fit_score}</span>
          )}
        </div>

        {campaign.fit_reason && (
          <p className="text-xs text-zinc-500 bg-zinc-800/40 rounded-lg px-3 py-2.5 leading-relaxed border border-zinc-800">
            {campaign.fit_reason}
          </p>
        )}

        <div>
          <p className="text-xs font-medium text-zinc-400 mb-2">Move to stage</p>
          <div className="flex flex-wrap gap-1.5">
            {nextStages.map(s => (
              <button
                key={s.value}
                onClick={() => onStageChange(campaign.id, s.value)}
                className={`text-2xs font-mono px-2 py-1 rounded border transition-colors hover:border-zinc-500 ${s.color}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Follow-up date"
            type="date"
            value={followup}
            onChange={e => setFollowup(e.target.value)}
          />
          <Input
            label="Probability (%)"
            type="number"
            min="0"
            max="100"
            value={probability}
            onChange={e => setProbability(e.target.value)}
          />
        </div>

        <Textarea
          label="Notes"
          rows={3}
          placeholder="Context, impressions, contact info..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        {campaign.venue?.booking_email && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="text-zinc-600">Contact:</span>
            <a href={`mailto:${campaign.venue.booking_email}`} className="text-zinc-300 hover:text-white transition-colors flex items-center gap-1">
              {campaign.venue.booking_email}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="danger"
            size="sm"
            onClick={() => { if (confirm('Remove this lead?')) onDelete(campaign.id) }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={save} loading={saving}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}

function AddLeadModal({
  venues,
  onClose,
  onAdded,
}: {
  venues: Venue[]
  onClose: () => void
  onAdded: () => void
}) {
  const [venueId, setVenueId] = useState('')
  const [venueName, setVenueName] = useState('')
  const [venueCity, setVenueCity] = useState('')
  const [stage, setStage] = useState<PipelineStage>('wishlist')
  const [contactEmail, setContactEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [useExisting, setUseExisting] = useState(true)

  async function handleAdd() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let finalVenueId = venueId || null

    if (!useExisting && venueName) {
      const { data: newVenue } = await supabase.from('venues').insert({
        name: venueName,
        city: venueCity,
        genres: [],
        recent_lineups: [],
      }).select().single()
      finalVenueId = newVenue?.id ?? null
    }

    await supabase.from('campaigns').insert({
      user_id: user.id,
      venue_id: finalVenueId,
      stage,
      contact_email: contactEmail || null,
      notes: notes || null,
      probability: 0,
    })
    onAdded()
  }

  return (
    <Modal open onClose={onClose} title="Add lead">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={useExisting ? 'secondary' : 'ghost'}
            onClick={() => setUseExisting(true)}
          >
            Existing venue
          </Button>
          <Button
            size="sm"
            variant={!useExisting ? 'secondary' : 'ghost'}
            onClick={() => setUseExisting(false)}
          >
            New venue
          </Button>
        </div>

        {useExisting ? (
          <Select
            label="Venue"
            options={venues.map(v => ({ value: v.id, label: `${v.name} — ${v.city}` }))}
            placeholder="Select venue..."
            value={venueId}
            onChange={e => setVenueId(e.target.value)}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Venue name"
              value={venueName}
              onChange={e => setVenueName(e.target.value)}
              placeholder="e.g. Trouw"
            />
            <Input
              label="City"
              value={venueCity}
              onChange={e => setVenueCity(e.target.value)}
              placeholder="Amsterdam"
            />
          </div>
        )}

        <Select
          label="Stage"
          options={PIPELINE_STAGES.map(s => ({ value: s.value, label: s.label }))}
          value={stage}
          onChange={e => setStage(e.target.value as PipelineStage)}
        />

        <Input
          label="Contact email"
          type="email"
          value={contactEmail}
          onChange={e => setContactEmail(e.target.value)}
          placeholder="bookings@venue.com"
        />

        <Textarea
          label="Notes"
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any context..."
        />

        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={handleAdd} loading={loading}>
            Add lead
          </Button>
        </div>
      </div>
    </Modal>
  )
}
