export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { XP_REWARDS, getLevelProgress } from '@/lib/gamification'

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value }
      }
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { durationMin, sessionId, cardioType, avgHr } = await req.json()
    const userId = session.user.id

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    }

    let earnedXp = XP_REWARDS.CARDIO_BASE

    if (durationMin >= 60) {
      earnedXp += XP_REWARDS.CARDIO_60MIN
    } else if (durationMin >= 30) {
      earnedXp += XP_REWARDS.CARDIO_30MIN
    }

    if (cardioType === 'hiit') {
      earnedXp += XP_REWARDS.HIIT_COMPLETE
    }

    if (avgHr) {
      // heart zone logic: highest reward wins
      if (avgHr > 170) {
        earnedXp += XP_REWARDS.HEART_ZONE_5
      } else if (avgHr > 150) {
        earnedXp += XP_REWARDS.HEART_ZONE_4
      }
    }

    // Busca o user_stats
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('user_stats')
      .select('xp_total, level')
      .eq('user_id', userId)
      .single()

    if (statsError) throw statsError

    const currentXp = stats?.xp_total || 0
    const newXp = currentXp + earnedXp
    const { level: newLevel } = getLevelProgress(newXp)

    // Atualiza o user_stats
    const { error: updateError } = await supabaseAdmin
      .from('user_stats')
      .update({ xp_total: newXp, level: newLevel })
      .eq('user_id', userId)

    if (updateError) throw updateError

    // Retorna o resumo do ganho
    return NextResponse.json({
      success: true,
      earnedXp,
      newXp,
      newLevel,
      leveledUp: newLevel > (stats?.level || 1)
    })
  } catch (error: any) {
    console.error('Erro na gamificação de cardio:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
