import Link from 'next/link'
import { ArrowRight, BarChart2, Map, Mail, Users } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-900/80 backdrop-blur-sm bg-[#09090b]/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">Pitchdeck</span>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-zinc-50 text-zinc-950 px-3.5 py-1.5 rounded-md font-medium hover:bg-zinc-200 transition-colors"
            >
              Start Pitching
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-2xs font-mono text-zinc-500 tracking-widest uppercase mb-8 border border-zinc-800 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            CRM for independent artists
          </div>
          <h1 className="text-[clamp(2.8rem,8vw,6rem)] font-semibold leading-[1.0] tracking-tight text-balance mb-6">
            Book smarter.<br />Not louder.
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl leading-relaxed mb-10">
            A CRM for independent DJs and selectors. Discover venues, send pitches,
            track your pipeline, and tour with intent.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-zinc-50 text-zinc-950 px-5 py-2.5 rounded-md font-medium text-sm hover:bg-zinc-200 transition-colors"
            >
              Start Pitching
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* Venue card preview */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/40">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-2xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Venue Match</p>
                <h3 className="text-xl font-semibold">Garage Noord</h3>
                <p className="text-sm text-zinc-400 mt-0.5">Amsterdam · Club · 350 cap</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold tracking-tight">84</div>
                <p className="text-2xs text-zinc-500 mt-0.5">Fit Score</p>
              </div>
            </div>
            <div className="h-px bg-zinc-800 mb-4" />
            <p className="text-sm text-zinc-300 leading-relaxed">
              Strong overlap with minimal-house selectors and touring artists.
              Intimate scale matches your booking profile. Active in your touring region.
            </p>
            <div className="flex gap-2 mt-4">
              {['minimal', 'house', 'techno'].map(g => (
                <span key={g} className="text-2xs font-mono text-zinc-400 border border-zinc-700 rounded px-2 py-0.5">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <p className="text-2xs font-mono text-zinc-500 uppercase tracking-widest mb-12">Features</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {FEATURES.map(f => (
              <div key={f.title} className="flex gap-4">
                <div className="mt-0.5 p-2 border border-zinc-800 rounded-lg h-fit">
                  <f.icon className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-100 mb-1">{f.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline preview */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <p className="text-2xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Pipeline</p>
          <h2 className="text-2xl font-semibold tracking-tight mb-8">Every stage of the booking.</h2>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={`text-sm px-3 py-1.5 rounded-md border ${s.style}`}>{s.label}</span>
                {i < STAGES.length - 1 && (
                  <span className="text-zinc-700">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-tight leading-tight mb-6">
            Your next booking<br />starts here.
          </h2>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-zinc-50 text-zinc-950 px-5 py-2.5 rounded-md font-medium text-sm hover:bg-zinc-200 transition-colors"
          >
            Start Pitching <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-400">Pitchdeck</span>
          <p className="text-xs text-zinc-600">For independent artists.</p>
        </div>
      </footer>
    </div>
  )
}

const FEATURES = [
  {
    icon: Users,
    title: 'Venue Discovery',
    description: 'Search clubs, radios, and collectives by genre, city, and capacity. Get a fit score based on your profile.',
  },
  {
    icon: BarChart2,
    title: 'CRM Pipeline',
    description: 'Track every venue from wishlist to booked. Kanban and table views. Never lose a follow-up.',
  },
  {
    icon: Mail,
    title: 'Pitch Generator',
    description: 'AI-written emails, Instagram DMs, and intros. Warm, direct, and human. No corporate filler.',
  },
  {
    icon: Map,
    title: 'Tour Planner',
    description: 'Plan tour routes with optimized stops. Map view, calendar, and outreach priority per city.',
  },
]

const STAGES = [
  { label: 'Wishlist', style: 'text-zinc-400 border-zinc-700' },
  { label: 'To Contact', style: 'text-blue-400 border-blue-900' },
  { label: 'Sent', style: 'text-amber-400 border-amber-900' },
  { label: 'Opened', style: 'text-emerald-400 border-emerald-900' },
  { label: 'Interested', style: 'text-violet-400 border-violet-900' },
  { label: 'Booked', style: 'text-green-400 border-green-900' },
]
