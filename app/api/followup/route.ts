import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface FollowUpRequest {
  campaign_id: string
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaign_id } = await request.json() as FollowUpRequest

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, venue:venues(*), messages(*)')
    .eq('id', campaign_id)
    .eq('user_id', user.id)
    .single()

  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const daysSinceSent = campaign.last_outreach_at
    ? Math.floor((Date.now() - new Date(campaign.last_outreach_at).getTime()) / 86400000)
    : null

  let recommendation: string
  let action: 'wait' | 'follow_up' | 'update_pitch'

  if (campaign.stage === 'opened' && daysSinceSent && daysSinceSent >= 5) {
    recommendation = `They opened your message ${daysSinceSent} days ago with no reply. A brief, friendly follow-up is appropriate — keep it under 3 sentences.`
    action = 'follow_up'
  } else if (campaign.stage === 'sent' && daysSinceSent && daysSinceSent >= 10) {
    recommendation = `It's been ${daysSinceSent} days since you sent your pitch. Consider following up once — briefly reference your original message.`
    action = 'follow_up'
  } else if (campaign.stage === 'sent' && daysSinceSent && daysSinceSent < 5) {
    recommendation = `Only ${daysSinceSent} day${daysSinceSent !== 1 ? 's' : ''} since your last message. Give it a bit more time before following up.`
    action = 'wait'
  } else if (campaign.stage === 'interested') {
    recommendation = `They're interested — move quickly. Propose specific dates or ask what their process looks like.`
    action = 'follow_up'
  } else {
    recommendation = `No urgent action needed. Continue monitoring and follow up if you have a new release, booking, or relevant news.`
    action = 'wait'
  }

  return NextResponse.json({ recommendation, action, days_since_sent: daysSinceSent })
}
