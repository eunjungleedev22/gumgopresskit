'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { formatDate } from '@/lib/utils'
import { Plus, MapPin, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { Tour, TourStop, Venue } from '@/types'

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [newTourOpen, setNewTourOpen] = useState(false)
  const [expandedTour, setExpandedTour] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: t }, { data: v }] = await Promise.all([
      supabase
        .from('tours')
        .select('*, stops:tour_stops(*, venue:venues(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('venues').select('*').order('name'),
    ])
    setTours((t ?? []) as Tour[])
    setVenues((v ?? []) as Venue[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function deleteTour(id: string) {
    const supabase = createClient()
    await supabase.from('tours').delete().eq('id', id)
    setTours(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Planning</p>
          <h1 className="text-2xl font-semibold tracking-tight">Tours</h1>
          <p className="text-sm text-zinc-400 mt-1">Plan routes, track stops, prioritise outreach by city.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setNewTourOpen(true)}>
          <Plus className="w-3.5 h-3.5" />
          New tour
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tours.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
          <MapPin className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No tours planned yet.</p>
          <Button size="sm" variant="ghost" className="mt-3" onClick={() => setNewTourOpen(true)}>
            Plan your first tour
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tours.map(tour => (
            <TourCard
              key={tour.id}
              tour={tour}
              venues={venues}
              expanded={expandedTour === tour.id}
              onToggle={() => setExpandedTour(prev => prev === tour.id ? null : tour.id)}
              onDelete={() => { if (confirm('Delete this tour?')) deleteTour(tour.id) }}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      {newTourOpen && (
        <NewTourModal
          onClose={() => setNewTourOpen(false)}
          onCreated={() => { setNewTourOpen(false); load() }}
        />
      )}
    </div>
  )
}

function TourCard({
  tour,
  venues,
  expanded,
  onToggle,
  onDelete,
  onRefresh,
}: {
  tour: Tour
  venues: Venue[]
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  onRefresh: () => void
}) {
  const stops = (tour.stops ?? []).sort((a, b) =>
    (a.date ?? '') < (b.date ?? '') ? -1 : 1
  )

  const statusColor = {
    planning: 'text-amber-400 bg-amber-950/40 border-amber-900',
    confirmed: 'text-emerald-400 bg-emerald-950/40 border-emerald-900',
    completed: 'text-zinc-400 bg-zinc-800/40 border-zinc-700',
    cancelled: 'text-red-400 bg-red-950/40 border-red-900',
  }[tour.status]

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-zinc-900/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-medium text-zinc-100">{tour.name}</h3>
            <span className={`text-2xs font-mono px-2 py-0.5 rounded border ${statusColor}`}>
              {tour.status}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            {stops.length} stop{stops.length !== 1 ? 's' : ''}
            {tour.start_date && ` · from ${formatDate(tour.start_date)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800">
          {/* Route map (simplified visual) */}
          {stops.length > 0 && (
            <div className="px-5 py-4 border-b border-zinc-800/60">
              <p className="text-2xs font-mono text-zinc-600 uppercase tracking-widest mb-3">Route</p>
              <div className="flex items-center gap-0 flex-wrap">
                {stops.map((stop, i) => (
                  <div key={stop.id} className="flex items-center gap-0">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-zinc-500 border border-zinc-400" />
                      <p className="text-xs text-zinc-300 mt-1">{stop.city}</p>
                      {stop.date && (
                        <p className="text-2xs text-zinc-600">{formatDate(stop.date)}</p>
                      )}
                    </div>
                    {i < stops.length - 1 && (
                      <div className="w-8 h-px bg-zinc-700 mb-5 mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stops list */}
          <div className="divide-y divide-zinc-800/60">
            {stops.map((stop, i) => (
              <TourStopRow key={stop.id} stop={stop} index={i} onRefresh={onRefresh} />
            ))}
          </div>

          <div className="px-5 py-3">
            <AddStopInline tourId={tour.id} venues={venues} onAdded={onRefresh} />
          </div>
        </div>
      )}
    </div>
  )
}

function TourStopRow({ stop, index, onRefresh }: { stop: TourStop; index: number; onRefresh: () => void }) {
  const statusColor = {
    planning: 'text-amber-400',
    confirmed: 'text-emerald-400',
    cancelled: 'text-red-400',
  }[stop.status]

  async function updateStatus(status: TourStop['status']) {
    const supabase = createClient()
    await supabase.from('tour_stops').update({ status }).eq('id', stop.id)
    onRefresh()
  }

  async function remove() {
    const supabase = createClient()
    await supabase.from('tour_stops').delete().eq('id', stop.id)
    onRefresh()
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <span className="text-xs text-zinc-700 font-mono w-5 shrink-0">{index + 1}</span>
      <MapPin className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200">{stop.city}{stop.country ? `, ${stop.country}` : ''}</p>
        {stop.venue?.name && (
          <p className="text-xs text-zinc-500">{stop.venue.name}</p>
        )}
      </div>
      {stop.date && (
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Calendar className="w-3 h-3" />
          {formatDate(stop.date)}
        </div>
      )}
      <select
        value={stop.status}
        onChange={e => updateStatus(e.target.value as TourStop['status'])}
        onClick={e => e.stopPropagation()}
        className={`text-2xs font-mono bg-transparent border-none outline-none cursor-pointer ${statusColor}`}
      >
        <option value="planning">planning</option>
        <option value="confirmed">confirmed</option>
        <option value="cancelled">cancelled</option>
      </select>
      <button
        onClick={remove}
        className="p-1 text-zinc-700 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  )
}

function AddStopInline({ tourId, venues, onAdded }: { tourId: string; venues: Venue[]; onAdded: () => void }) {
  const [city, setCity] = useState('')
  const [date, setDate] = useState('')
  const [venueId, setVenueId] = useState('')
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)

  async function add() {
    if (!city) return
    setAdding(true)
    const supabase = createClient()
    await supabase.from('tour_stops').insert({
      tour_id: tourId,
      city,
      date: date || null,
      venue_id: venueId || null,
      order_index: 0,
      status: 'planning',
    })
    setCity('')
    setDate('')
    setVenueId('')
    setOpen(false)
    setAdding(false)
    onAdded()
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Plus className="w-3.5 h-3.5" />
        Add stop
      </Button>
    )
  }

  return (
    <div className="flex items-end gap-2 flex-wrap">
      <Input
        placeholder="City"
        value={city}
        onChange={e => setCity(e.target.value)}
        className="w-32"
      />
      <Input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="w-36"
      />
      <Select
        options={venues.map(v => ({ value: v.id, label: v.name }))}
        placeholder="Venue (opt.)"
        value={venueId}
        onChange={e => setVenueId(e.target.value)}
        className="w-40"
      />
      <Button size="sm" variant="primary" onClick={add} loading={adding}>Add</Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  )
}

function NewTourModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  async function create() {
    if (!name) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('tours').insert({
      user_id: user.id,
      name,
      start_date: startDate || null,
      end_date: endDate || null,
      status: 'planning',
    })
    onCreated()
  }

  return (
    <Modal open onClose={onClose} title="New tour">
      <div className="space-y-4">
        <Input
          label="Tour name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Spring EU 2025"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input label="End date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="flex-1" onClick={create} loading={loading}>Create tour</Button>
        </div>
      </div>
    </Modal>
  )
}
