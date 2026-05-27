import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import type { PipelineStage, Profile, Venue, VenueFitResult } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return format(parseISO(date), 'MMM d, yyyy')
}

export function formatRelative(date: string | null): string {
  if (!date) return '—'
  return formatDistanceToNow(parseISO(date), { addSuffix: true })
}

export const PIPELINE_STAGES: { value: PipelineStage; label: string; color: string }[] = [
  { value: 'wishlist', label: 'Wishlist', color: 'text-zinc-400 bg-zinc-800/60' },
  { value: 'to_contact', label: 'To Contact', color: 'text-blue-400 bg-blue-950/60' },
  { value: 'sent', label: 'Sent', color: 'text-amber-400 bg-amber-950/60' },
  { value: 'opened', label: 'Opened', color: 'text-emerald-400 bg-emerald-950/60' },
  { value: 'interested', label: 'Interested', color: 'text-violet-400 bg-violet-950/60' },
  { value: 'booked', label: 'Booked', color: 'text-green-400 bg-green-950/60' },
  { value: 'rejected', label: 'Rejected', color: 'text-red-400 bg-red-950/60' },
]

export function getStageMeta(stage: PipelineStage) {
  return PIPELINE_STAGES.find(s => s.value === stage) ?? PIPELINE_STAGES[0]
}

export const GENRES = [
  'techno', 'house', 'minimal', 'deep house', 'acid', 'experimental',
  'industrial', 'ambient', 'drum & bass', 'jungle', 'garage', 'disco',
  'soul', 'jazz', 'afro', 'electro', 'breaks', 'bass music', 'UK bass',
  'leftfield', 'noise', 'dub', 'roots', 'reggae', 'balearic', 'cosmic',
]

export const VENUE_TYPES = [
  { value: 'club', label: 'Club' },
  { value: 'radio', label: 'Radio' },
  { value: 'collective', label: 'Collective' },
  { value: 'festival', label: 'Festival' },
  { value: 'bar', label: 'Bar / Venue' },
]

export function calculateFitScore(venue: Venue, profile: Profile): VenueFitResult {
  let score = 0
  const highlights: string[] = []

  const profileGenres = profile.genres ?? []
  const venueGenres = venue.genres ?? []

  const overlap = profileGenres.filter(g =>
    venueGenres.some(vg => vg.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(vg.toLowerCase()))
  )

  const genreScore = Math.min(40, overlap.length * 14)
  score += genreScore
  if (overlap.length >= 2) highlights.push(`${overlap.length} shared genres (${overlap.slice(0, 2).join(', ')})`)
  else if (overlap.length === 1) highlights.push(`Genre match: ${overlap[0]}`)

  const homeCity = profile.home_city?.toLowerCase() ?? ''
  const venueCity = venue.city?.toLowerCase() ?? ''
  const touringRegions = (profile.touring_regions ?? []).map(r => r.toLowerCase())

  if (homeCity && homeCity === venueCity) {
    score += 20
    highlights.push('Local venue')
  } else if (touringRegions.some(r => r.includes(venueCity) || venueCity.includes(r))) {
    score += 14
    highlights.push('In your touring region')
  } else {
    score += 4
  }

  const cap = venue.capacity
  if (!cap || cap < 400) {
    score += 18
    highlights.push('Intimate scale')
  } else if (cap < 800) {
    score += 12
    if (!highlights.some(h => h.includes('scale'))) highlights.push('Mid-size venue')
  } else {
    score += 6
  }

  if (venue.venue_type === 'collective') score += 18
  else if (venue.venue_type === 'radio') score += 12
  else if (venue.venue_type === 'club') score += 15
  else score += 8

  const final = Math.min(100, score)

  let reason = ''
  if (final >= 80) reason = highlights.join('. ') + '.'
  else if (final >= 60) reason = highlights.length ? highlights.join('. ') + '.' : 'Moderate match based on your profile.'
  else reason = 'Limited overlap — worth tracking for future outreach.'

  return { venue, score: final, reason, highlights }
}

export function formatProbability(p: number): string {
  if (p === 0) return '—'
  return `${p}%`
}
