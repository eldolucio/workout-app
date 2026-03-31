import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { XP_REWARDS, getLevelProgress } from '@/lib/gamification'

export async function POST(req: Request) {
  try {
    const { userId, durationMin, sessionId, cardioType, avgHr } = await req.json()
    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'Missing userId or sessionId' }, { status: 400 })
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
      // simplistic heart zone check∏∏∏p
      if (avgHr > 150) earnedXp += XP_REWARDS.HEART_ZONE_4
      if (avgHr > 170) earnedXp += XP_REWARDS.HEART_ZONE_5
    }

    // Busca o user_stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('xp_total, level')
      .eq('user_id', userId)
      .single()

    if (statsError) throw statsError

    const currentXp = stats?.xp_total || 0
    const newXp = currentXp + earnedXp
    const { level: newLevel } = getLevelProgress(newXp)

    // Atualiza o user_stats
    const { error: updateError } = await supabase
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
