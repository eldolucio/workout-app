import { CardioType, HEART_ZONES, HeartZoneInfo } from "@/types/cardio"

// Calcula FC máxima pela idade
export function maxHeartRate(birthYear: number): number {
  if (!birthYear) return 190 // fallback se não tiver idade (aprox 30 anos)
  const age = new Date().getFullYear() - birthYear
  return 220 - age
}

// Determina zona de FC
export function getHeartZone(heartRate: number, maxHR: number): HeartZoneInfo {
  if (!heartRate || heartRate === 0) return HEART_ZONES[0]
  const pct = (heartRate / maxHR) * 100
  return HEART_ZONES.find(z => pct >= z.minPct && pct < z.maxPct)
    ?? HEART_ZONES[HEART_ZONES.length - 1]
}

// Formata segundos em MM:SS
export function formatTime(seconds: number): string {
  if (seconds < 0) seconds = 0
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// Formata pace (seg/km) em MM:SS /km
export function formatPace(secPerKm: number): string {
  if (!secPerKm || secPerKm === Infinity || secPerKm === 0) return '--:-- /km'
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60).toString().padStart(2, '0')
  return `${m}:${s} /km`
}

// Estima calorias queimadas
export function estimateCalories(
  durationMin: number,
  cardioType: CardioType,
  weightKg: number = 70,
  intensityFactor: number = 1
): number {
  const MET: Record<CardioType, number> = {
    esteira:  8.0,
    bike:     6.5,
    eliptico: 5.5,
    hiit:     10.0,
  }
  // Fórmula: Calorias = MET × peso(kg) × tempo(h) × fator
  return Math.round(MET[cardioType] * weightKg * (durationMin / 60) * intensityFactor)
}

// Converte velocidade em pace (seg/km)
export function speedToPace(speedKmh: number): number {
  if (!speedKmh || speedKmh <= 0) return 0
  return Math.round(3600 / speedKmh) // segundos por km
}
