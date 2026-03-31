// XP necessário para cada nível (progressão exponencial)
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.3, level - 1))
}

// Nível baseado no XP total
export function levelFromXp(xp: number): number {
  let level = 1
  let currentLevelXp = xpForLevel(level)
  let xpRemaining = xp

  while (xpRemaining >= currentLevelXp) {
    xpRemaining -= currentLevelXp
    level++
    currentLevelXp = xpForLevel(level)
  }
  return level
}

// Calcula quanto XP falta para o próximo nível e o progresso (%)
export function getLevelProgress(xp: number) {
  let level = 1
  let accumulated = 0
  let nextLevelXpThreshold = xpForLevel(level)

  while (xp >= accumulated + nextLevelXpThreshold) {
    accumulated += nextLevelXpThreshold
    level++
    nextLevelXpThreshold = xpForLevel(level)
  }

  const xpInCurrentLevel = xp - accumulated
  const percent = Math.floor((xpInCurrentLevel / nextLevelXpThreshold) * 100)

  return { level, xpInCurrentLevel, nextLevelXpThreshold, percent }
}

// Nomes dos títulos baseados no nível
export function getLevelTitle(level: number): string {
  if (level <= 2) return "Iniciante"
  if (level <= 4) return "Esforçado"
  if (level <= 7) return "Consistente"
  if (level <= 10) return "Avançado"
  if (level <= 15) return "Elite"
  if (level <= 20) return "Lenda"
  return "Imortal"
}

// XP ganho por ação
export const XP_REWARDS = {
  COMPLETE_WORKOUT:   40,   // treino concluído
  COMPLETE_SET:        2,   // série concluída
  IMPORT_OCR:         30,   // importar ficha
  LOGIN_STREAK:       15,   // manter sequência diária
  PERFECT_WEEK:      120,   // 5+ treinos em 7 dias
  CARDIO_BASE:        25,   // qualquer sessão de cardio concluída
  CARDIO_30MIN:       15,   // bônus por 30+ minutos
  CARDIO_60MIN:       30,   // bônus por 60+ minutos
  HIIT_COMPLETE:      35,   // HIIT concluído
  HEART_ZONE_4:       20,   // treinou na zona 4
  HEART_ZONE_5:       30,   // treinou na zona 5
  CARDIO_STREAK:      10,   // cardio em dias consecutivos
}

// Calcula sequência de dias consecutivos (streak)
export function calculateStreak(sessionDates: string[]): number {
  if (!sessionDates || sessionDates.length === 0) return 0
  
  const dates = [...new Set(sessionDates.map(d => d.split('T')[0]))]
    .sort()
    .reverse()
  
  if (dates.length === 0) return 0

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Se não treinou nem hoje nem ontem, a sequência quebrou
  if (dates[0] !== today && dates[0] !== yesterday) return 0

  let streak = 0
  let lastCheckedDate = new Date(dates[0])

  for (let i = 0; i < dates.length; i++) {
    const currentDate = new Date(dates[i])
    const diffTime = Math.abs(lastCheckedDate.getTime() - currentDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (i === 0 || diffDays === 1) {
      streak++
      lastCheckedDate = currentDate
    } else if (diffDays === 0) {
      // Mesma data, ignora
      continue
    } else {
      break
    }
  }

  return streak
}
