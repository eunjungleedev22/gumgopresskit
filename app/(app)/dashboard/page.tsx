import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatRelative, getStageMeta, PIPELINE_STAGES } from '@/lib/utils'
import { ArrowRight, TrendingUp } from 'lucide-react'
import type { Campaign, Profile } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: campaigns }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('campaigns')
      .select('*, venue:venues(*)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
  ])

  const p = profile as Profile | null
  const c = (campaigns ?? []) as Campaign[]

  const total = c.length
  const sent = c.filter(x => ['sent', 'opened', 'interested', 'booked', 'rejected'].includes(x.stage)).length
  const replied = c.filter(x => ['interested', 'booked'].includes(x.stage)).length
  const booked = c.filter(x => x.stage === 'booked').length
  const replyRate = sent > 0 ? Math.round((replied / sent) * 100) : 0
  const bookRate = sent > 0 ? Math.round((booked / sent) * 100) : 0

  const stageCounts = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s.value] = c.filter(x => x.stage === s.value).length
    return acc
  }, {} as Record<string, number>)

  const upcoming = c
    .filter(x => x.next_followup_at)
    .sort((a, b) => new Date(a.next_followup_at!).getTime() - new Date(b.next_followup_at!).getTime())
    .slice(0, 4)

  const recent = c.slice(0, 5)

  const djName = p?.dj_name ?? user.email?.split('@')[0] ?? 'Artist'
  const isNew = total === 0

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <p className="text-2xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Overview</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isNew ? `Welcome, ${djName}` : `Good to have you, ${djName}`}
        </h1>
        {isNew && (
          <p className="text-sm text-zinc-400 mt-1">
            Start by{' '}
            <Link href="/venues" className="text-zinc-200 underline underline-offset-2">discovering venues</Link>{' '}
            or{' '}
            <Link href="/crm" className="text-zinc-200 underline underline-offset-2">adding your first lead</Link>.
          </p>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Venues contacted', value: sent.toString() },
          { label: 'Reply rate', value: `${replyRate}%` },
          { label: 'Booked', value: booked.toString() },
          { label: 'Booking rate', value: `${bookRate}%` },
        ].map(m => (
          <div key={m.label} className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/30">
            <p className="text-xs text-zinc-500 mb-2">{m.label}</p>
            <p className="text-3xl font-semibold tabular-nums tracking-tight">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pipeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-zinc-200">Pipeline</p>
            <Link href="/crm" className="text-xs text-zinc-500 hover:text-zinc-200 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {PIPELINE_STAGES.map(s => {
              const count = stageCounts[s.value] ?? 0
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={s.value} className="flex items-center gap-3 py-1.5">
                  <span className={`text-2xs font-mono w-24 shrink-0 ${s.color.split(' ')[0]}`}>
                    {s.label}
                  </span>
                  <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 tabular-nums w-5 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming follow-ups */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-zinc-200">Follow-ups due</p>
            <TrendingUp className="w-3.5 h-3.5 text-zinc-600" />
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-zinc-600">No follow-ups scheduled.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map(c => {
                const meta = getStageMeta(c.stage)
                return (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                    <div>
                      <p className="text-sm text-zinc-200">{c.venue?.name ?? 'Unknown venue'}</p>
                      <p className="text-xs text-zinc-500">{c.venue?.city}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xs font-mono ${meta.color} rounded px-1.5 py-0.5`}>
                        {meta.label}
                      </span>
                      <p className="text-2xs text-zinc-600 mt-1">
                        {formatRelative(c.next_followup_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-zinc-200">Recent activity</p>
            <Link href="/crm" className="text-xs text-zinc-500 hover:text-zinc-200 flex items-center gap-1 transition-colors">
              All leads <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            {recent.map((c, i) => {
              const meta = getStageMeta(c.stage)
              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between px-5 py-3.5 ${i < recent.length - 1 ? 'border-b border-zinc-800/60' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400 shrink-0">
                      {(c.venue?.name ?? '?')[0]}
                    </div>
                    <div>
                      <p className="text-sm text-zinc-100">{c.venue?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-zinc-500">{c.venue?.city ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xs font-mono rounded px-1.5 py-0.5 ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-zinc-600">{formatRelative(c.updated_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      {isNew && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/venues', title: 'Discover venues', desc: 'Find clubs and radios that match your sound.' },
            { href: '/pitch', title: 'Generate a pitch', desc: 'Write your first outreach email in 30 seconds.' },
            { href: '/tours', title: 'Plan a tour', desc: 'Map out cities and prioritise outreach.' },
          ].map(a => (
            <Link
              key={a.href}
              href={a.href}
              className="border border-zinc-800 rounded-xl p-5 hover:bg-zinc-900/40 transition-colors group"
            >
              <h3 className="text-sm font-medium text-zinc-100 mb-1 group-hover:text-white">{a.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{a.desc}</p>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-600 mt-3 group-hover:text-zinc-400 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
