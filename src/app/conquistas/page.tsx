'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Trophy, Lock, Flame } from 'lucide-react'
import NavBar from '@/components/NavBar'
import { getLevelProgress, getLevelTitle } from '@/lib/gamification'

export default function AchievementsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [allAchievements, setAllAchievements] = useState<any[]>([])
  const [userAchievements, setUserAchievements] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return router.push("/login")

        const [statsRes, allAchRes, myAchRes] = await Promise.all([
          supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
          supabase.from('achievements').select('*').order('xp_reward', { ascending: true }),
          supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id)
        ])

        if (statsRes.data) setStats(statsRes.data)
        if (allAchRes.data) setAllAchievements(allAchRes.data)
        if (myAchRes.data) setUserAchievements(myAchRes.data.map(a => a.achievement_id))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh' }} />

  const progress = getLevelProgress(stats?.xp_total || 0)
  const filtered = allAchievements.filter(ach => {
    const isUnlocked = userAchievements.includes(ach.id)
    if (filter === 'unlocked') return isUnlocked
    if (filter === 'locked') return !isUnlocked
    return true
  })

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <span style={styles.pageTitle}>CONQUISTAS</span>
        <div style={{ width: 60 }} />
      </header>

      <div style={styles.progressionCard}>
        <div style={styles.levelCircle}>
          <span style={styles.lvlLabel}>LVL</span>
          <span style={styles.lvlNumber}>{progress.level}</span>
        </div>
        <div style={styles.progressionInfo}>
          <div style={styles.row}>
            <span style={styles.levelTitle}>{getLevelTitle(progress.level)}</span>
            <span style={styles.xpText}>{stats?.xp_total || 0} XP Total</span>
          </div>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.progressBarFill, width: `${progress.percent}%` }} />
          </div>
          <div style={styles.row}>
            <span style={styles.smallLabel}>Progresso para o nível {progress.level + 1}</span>
            <span style={styles.smallLabel}>{progress.percent}%</span>
          </div>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.miniStat}>
          <Flame size={14} color="#c8f135" />
          <span>{stats?.streak_days || 0} dias</span>
        </div>
        <div style={styles.miniStat}>
          <Trophy size={14} color="#c8f135" />
          <span>{userAchievements.length} / {allAchievements.length}</span>
        </div>
      </div>

      <div style={styles.filterRow}>
        <button 
          style={{ ...styles.filterTab, ...(filter === 'all' ? styles.filterTabActive : {}) }}
          onClick={() => setFilter('all')}
        >Todas</button>
        <button 
          style={{ ...styles.filterTab, ...(filter === 'unlocked' ? styles.filterTabActive : {}) }}
          onClick={() => setFilter('unlocked')}
        >Desbloqueadas</button>
        <button 
          style={{ ...styles.filterTab, ...(filter === 'locked' ? styles.filterTabActive : {}) }}
          onClick={() => setFilter('locked')}
        >Bloqueadas</button>
      </div>

      <div style={styles.grid}>
        {filtered.map(ach => {
          const unlocked = userAchievements.includes(ach.id)
          return (
            <div key={ach.id} style={{ ...styles.card, opacity: unlocked ? 1 : 0.4 }}>
              <div style={styles.cardHeader}>
                <span style={styles.achIcon}>{ach.icon}</span>
                {!unlocked && <Lock size={14} color="#444" style={styles.lockIcon} />}
                <span style={styles.xpReward}>+{ach.xp_reward} XP</span>
              </div>
              <h3 style={{ ...styles.achName, color: unlocked ? '#f0f0f0' : '#888' }}>{ach.name}</h3>
              <p style={styles.achDesc}>{ach.description}</p>
            </div>
          )
        })}
      </div>

      <NavBar />
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#0a0a0a', maxWidth: '430px', margin: 'auto', paddingBottom: '110px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' },
  backBtn: { background: 'none', border: 'none', color: '#555', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontFamily: 'Barlow, sans-serif' },
  pageTitle: { color: '#f0f0f0', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '16px' },
  progressionCard: { background: '#161616', border: '1px solid #222', borderRadius: '20px', margin: '0 20px 20px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center' },
  levelCircle: { width: '70px', height: '70px', borderRadius: '50%', border: '3px solid #c8f135', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(200, 241, 53, 0.2)' },
  lvlLabel: { fontSize: '10px', color: '#555', fontWeight: 800, marginBottom: '-4px' },
  lvlNumber: { fontSize: '32px', color: '#c8f135', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800 },
  progressionInfo: { flex: 1 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  levelTitle: { color: '#f0f0f0', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '18px', textTransform: 'uppercase' as const },
  xpText: { color: '#555', fontSize: '12px' },
  progressBarBg: { height: '8px', background: '#0a0a0a', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' },
  progressBarFill: { height: '100%', background: '#c8f135' },
  smallLabel: { fontSize: '11px', color: '#444' },
  statsRow: { display: 'flex', gap: '12px', padding: '0 20px 20px' },
  miniStat: { background: '#161616', border: '1px solid #222', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#ccc', fontWeight: 600 },
  filterRow: { display: 'flex', gap: '8px', padding: '0 20px 16px', overflowX: 'auto' as const },
  filterTab: { background: '#161616', border: '1px solid #222', borderRadius: '20px', padding: '6px 16px', color: '#555', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: '0.2s' },
  filterTabActive: { background: '#c8f135', border: '1px solid #c8f135', color: '#0a0a0a' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 20px' },
  card: { background: '#161616', border: '1px solid #222', borderRadius: '16px', padding: '16px', position: 'relative' as const },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
  achIcon: { fontSize: '28px' },
  lockIcon: { marginTop: '4px' },
  xpReward: { fontSize: '10px', color: '#c8f135', fontWeight: 800, background: '#1a2a00', padding: '2px 6px', borderRadius: '4px' },
  achName: { fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '14px', margin: '0 0 4px 0', textTransform: 'uppercase' as const },
  achDesc: { fontSize: '11px', color: '#555', margin: 0, lineHeight: '1.4' }
}
