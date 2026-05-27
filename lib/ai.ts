import type { PitchGeneratorInput, GeneratedPitch } from '@/types'

const SYSTEM_PROMPT = `You are a copywriter helping independent DJs and music selectors write outreach messages to venues and promoters.
Write in a warm, human, direct voice. No corporate language. No exaggeration. Sound like a real person reaching out.
Keep emails under 120 words. DMs under 60 words. Intros under 25 words.
Never start with "I hope this email finds you well" or similar filler.`

function buildUserPrompt(input: PitchGeneratorInput): string {
  return `Write three outreach messages for a DJ reaching out to a venue.

DJ: ${input.dj_name}
Genres: ${input.dj_genres.join(', ')}
BPM range: ${input.bpm_range}
SoundCloud: ${input.soundcloud_url ?? 'not provided'}

Venue: ${input.venue_name}, ${input.venue_city}
Venue genres: ${input.venue_genres.join(', ')}

Tone: ${input.tone}
${input.tour_dates ? `Tour dates: ${input.tour_dates}` : ''}
${input.additional_context ? `Additional context: ${input.additional_context}` : ''}

Return valid JSON with this exact shape:
{
  "email": "full email text",
  "dm": "instagram dm text",
  "intro": "one-sentence intro"
}
No markdown. No code fences. Just the JSON object.`
}

export async function generatePitch(input: PitchGeneratorInput): Promise<GeneratedPitch> {
  const apiBase = process.env.OPENAI_API_BASE ?? 'https://api.openai.com/v1'
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

  const res = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    }),
  })

  if (!res.ok) {
    throw new Error(`AI API error: ${res.status}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''

  try {
    return JSON.parse(text) as GeneratedPitch
  } catch {
    return {
      email: text,
      dm: '',
      intro: '',
    }
  }
}
