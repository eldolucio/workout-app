import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { levelFromXp, XP_REWARDS, calculateStreak } from '@/lib/gamification'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
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

  const userId = session.user.id
  const { durationMinutes, startedAt } = await request.json()

  try {
    // 1. Calcula XP inicial do treino
    let xpEarned = XP_REWARDS.COMPLETE_WORKOUT

    // Bônus por treino rápido (efficiency)
    if (durationMinutes < 30) xpEarned += 10

    // Bônus por horários extremos (madrugador ou coruja noturna)
    const startedHour = new Date(startedAt).getHours()
    if (startedHour < 7 || startedHour >= 22) xpEarned += 10

    // 2. Busca estatísticas atuais do usuário
    const { data: existingStats } = await supabaseAdmin
      .from('user_stats').select('*').eq('user_id', userId).single()

    // 3. Calcula nova sequência (streak) a partir das últimas sessões
    const { data: sessionsData } = await supabaseAdmin
      .from('workout_sessions')
      .select('started_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(60)

    const streak = calculateStreak(sessionsData?.map(s => s.started_at) ?? [])
    if (streak > 1) xpEarned += XP_REWARDS.LOGIN_STREAK

    const currentXp = (existingStats?.xp_total ?? 0)
    const newXpTotal = currentXp + xpEarned
    
    const oldLevel = existingStats?.level ?? 1
    const newLevelCalculated = levelFromXp(newXpTotal)
    const leveledUp = newLevelCalculated > oldLevel

    // 4. Upsert estatísticas finais
    await supabaseAdmin.from('user_stats').upsert({
      user_id: userId,
      xp_total: newXpTotal,
      level: newLevelCalculated,
      streak_days: streak,
      last_workout: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })

    // 5. Verifica conquistas desbloqueadas agora
    const unlockedAchievementsSet: string[] = []
    const totalSessions = sessionsData?.length ?? 0

    const { data: myAchievements } = await supabaseAdmin
      .from('user_achievements')
      .select('achievement_id, achievements(slug)')
      .eq('user_id', userId)

    const alreadyUnlockedSlugs = myAchievements?.map((a: any) => a.achievements?.slug) ?? []

    const checks: Record<string, boolean> = {
      first_workout: totalSessions >= 1 && !alreadyUnlockedSlugs.includes('first_workout'),
      streak_3: streak >= 3 && !alreadyUnlockedSlugs.includes('streak_3'),
      streak_7: streak >= 7 && !alreadyUnlockedSlugs.includes('streak_7'),
      sessions_10: totalSessions >= 10 && !alreadyUnlockedSlugs.includes('sessions_10'),
      level_5: newLevelCalculated >= 5 && !alreadyUnlockedSlugs.includes('level_5'),
    }

    for (const [slug, isEarned] of Object.entries(checks)) {
      if (isEarned) {
        const { data: achInfo } = await supabaseAdmin
          .from('achievements').select('*')
          .eq('slug', slug).single()
        
        if (achInfo) {
          await supabaseAdmin.from('user_achievements').insert({
            user_id: userId,
            achievement_id: achInfo.id
          })
          
          await supabaseAdmin.from('user_stats')
            .update({ xp_total: newXpTotal + achInfo.xp_reward })
            .eq('user_id', userId)
          
          unlockedAchievementsSet.push(`${achInfo.icon} ${achInfo.name}`)
        }
      }
    }

    // 6. Enviar Notificação Push pelo Servidor
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Dispara em background para não travar a resposta da API
    // (Não usamos await se o runtime permitir, mas no Node/Vercel é melhor avisar que enviou)
    
    // Notificação do treino
    fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // No Vercel precisamos passar as cookies se for mesma origem ou usar Admin Key
      body: JSON.stringify({
        userId,
        title: leveledUp ? `⬆️ SUBIU DE NÍVEL: ${newLevelCalculated}!` : '✅ Treino concluído!',
        body: leveledUp 
          ? `Você subiu para o nível ${newLevelCalculated} e ganhou ${xpEarned} XP!` 
          : `Ganhos de hoje: +${xpEarned} XP · Streak: ${streak} dias 🔥`,
        tag: 'workout_complete'
      })
    }).catch(console.error)

    return NextResponse.json({
      xpEarned,
      newXpTotal,
      newLevel: newLevelCalculated,
      leveledUp,
      streak,
      newAchievements: unlockedAchievementsSet
    })
  } catch (err: any) {
    console.error('[API/Gamification]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
