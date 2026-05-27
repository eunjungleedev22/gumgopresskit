import { NextResponse } from 'next/server'
import { generatePitch } from '@/lib/ai'
import type { PitchGeneratorInput } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json() as PitchGeneratorInput

    if (!body.venue_name || !body.dj_name) {
      return NextResponse.json({ error: 'venue_name and dj_name are required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          email: `Hi,\n\nI'm ${body.dj_name}, a DJ and selector based in ${body.dj_genres?.slice(0, 2).join(' / ')} territory. I'd love to play at ${body.venue_name}.\n\nYou can hear my work here: ${body.soundcloud_url ?? '[SoundCloud link]'}\n\nOpen to discussing dates — would love to connect.\n\n${body.dj_name}`,
          dm: `Hey — I'm ${body.dj_name}, I'd love to play at ${body.venue_name}. Would you be open to chatting? ${body.soundcloud_url ?? ''}`,
          intro: `${body.dj_name} — ${body.dj_genres?.slice(0, 2).join(' / ')} selector, reaching out about ${body.venue_name}.`,
        },
        { status: 200 }
      )
    }

    const result = await generatePitch(body)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Pitch generation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
