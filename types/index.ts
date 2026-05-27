export type VenueType = 'club' | 'radio' | 'collective' | 'festival' | 'bar'

export type PipelineStage =
  | 'wishlist'
  | 'to_contact'
  | 'sent'
  | 'opened'
  | 'interested'
  | 'booked'
  | 'rejected'

export interface Profile {
  id: string
  dj_name: string | null
  genres: string[]
  bpm_min: number | null
  bpm_max: number | null
  home_city: string | null
  touring_regions: string[]
  epk_url: string | null
  soundcloud_url: string | null
  resident_advisor_url: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Venue {
  id: string
  name: string
  city: string
  country: string | null
  venue_type: VenueType | null
  capacity: number | null
  genres: string[]
  website: string | null
  instagram: string | null
  booking_email: string | null
  contact_name: string | null
  recent_lineups: string[]
  notes: string | null
  created_at: string
}

export interface Campaign {
  id: string
  user_id: string
  venue_id: string | null
  venue?: Venue
  stage: PipelineStage
  contact_name: string | null
  contact_email: string | null
  last_outreach_at: string | null
  next_followup_at: string | null
  notes: string | null
  probability: number
  fit_score: number | null
  fit_reason: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  campaign_id: string
  user_id: string
  message_type: 'email' | 'dm' | 'intro'
  content: string
  sent_at: string | null
  opened_at: string | null
  replied_at: string | null
  created_at: string
}

export interface Tour {
  id: string
  user_id: string
  name: string
  start_date: string | null
  end_date: string | null
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
  stops?: TourStop[]
}

export interface TourStop {
  id: string
  tour_id: string
  city: string
  country: string | null
  date: string | null
  venue_id: string | null
  venue?: Venue
  status: 'planning' | 'confirmed' | 'cancelled'
  notes: string | null
  order_index: number
  created_at: string
}

export interface VenueFitResult {
  venue: Venue
  score: number
  reason: string
  highlights: string[]
}

export interface DashboardMetrics {
  total_contacted: number
  reply_rate: number
  booked_count: number
  booked_rate: number
  avg_followup_days: number
  pipeline_counts: Record<PipelineStage, number>
}

export interface PitchGeneratorInput {
  venue_name: string
  venue_city: string
  venue_genres: string[]
  dj_name: string
  dj_genres: string[]
  bpm_range: string
  soundcloud_url?: string
  tour_dates?: string
  tone: 'warm' | 'professional' | 'casual'
  additional_context?: string
}

export interface GeneratedPitch {
  email: string
  dm: string
  intro: string
}
