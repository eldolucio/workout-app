'use client'
import { useState, useEffect } from 'react'
import { ChevronRight, Dumbbell, Sparkles, Trophy, Bell, Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const STEPS = [
  {
    id: 'welcome',
    title: 'Seja bem-vindo ao WorkoutApp!',
    description: 'Seu novo parceiro de evolução física e gamificação. Aqui você treina sério e sobe de nível de verdade.',
    icon: <Sparkles size={48} color="#c8f135" />,
    image: null
  },
  {
    id: 'import',
    title: 'Importe sua Ficha por Foto',
    description: 'Chega de papel! Tire uma foto da sua ficha de treino e nosso sistema OCR identifica exercícios, séries e repetições automaticamente.',
    icon: <Dumbbell size={48} color="#c8f135" />,
    image: null
  },
  {
    id: 'cardio',
    title: 'Cardio & HIIT Dinâmicos',
    description: 'Monitore sua frequência cardíaca via Bluetooth, acompanhe zonas de esforço em tempo real e realize protocolos de HIIT integrados.',
    icon: <Share2 size={48} color="#c8f135" />,
    image: null
  },
  {
    id: 'gamification',
    title: 'Ganhe XP e Conquistas',
    description: 'Cada treino concluído rende XP. Desbloqueie conquistas lendárias e veja seu nível crescer conforme sua constância aumenta.',
    icon: <Trophy size={48} color="#c8f135" />,
    image: null
  },
  {
    id: 'pwa',
    title: 'Instale como App Nativo',
    description: 'Adicione o WorkoutApp à sua tela de início para uma experiência de tela cheia e notificações instantâneas de lembrete.',
    icon: <Bell size={48} color="#c8f135" />,
    image: null
  }
]

export function OnboardingModal({ onComplete }: { onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Só mostra se for a primeira vez
    const hasSeen = localStorage.getItem('onboarding_seen')
    if (!hasSeen) {
      setVisible(true)
    }
  }, [])

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      localStorage.setItem('onboarding_seen', 'true')
      // Tenta salvar no banco também se possível
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)
      }
      setVisible(false)
      if (onComplete) onComplete()
    }
  }

  if (!visible) return null

  const step = STEPS[currentStep]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#161616',
        borderRadius: '32px',
        width: '100%',
        maxWidth: '430px',
        height: '90vh',
        maxHeight: '700px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #222'
      }}>
        {/* Progress Dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          padding: '30px 0 10px'
        }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === currentStep ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === currentStep ? '#c8f135' : '#333',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          textAlign: 'center'
        }}>
           <div style={{
             width: '120px',
             height: '120px',
             borderRadius: '30px',
             background: '#0a0a0a',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             marginBottom: '40px',
             boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
             border: '1px solid #222'
           }}>
             {step.icon}
           </div>

           <h2 style={{
             color: '#f0f0f0',
             fontFamily: 'Barlow Condensed',
             fontSize: '2.25rem',
             fontWeight: 800,
             margin: '0 0 16px 0',
             textTransform: 'uppercase',
             lineHeight: 1
           }}>
             {step.title}
           </h2>

           <p style={{
             color: '#888',
             fontFamily: 'Barlow',
             fontSize: '1.25rem',
             lineHeight: '1.6',
             margin: 0
           }}>
             {step.description}
           </p>
        </div>

        {/* Footer Area */}
        <div style={{ padding: '30px', background: '#1a1a1a' }}>
           <button 
             onClick={handleNext}
             style={{
               width: '100%',
               background: '#c8f135',
               color: '#0a0a0a',
               border: 'none',
               padding: '20px',
               borderRadius: '16px',
               fontFamily: 'Barlow Condensed',
               fontSize: '1.25rem',
               fontWeight: 800,
               textTransform: 'uppercase',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '12px',
               cursor: 'pointer',
               boxShadow: '0 10px 30px rgba(200, 241, 53, 0.2)'
             }}
           >
             {currentStep === STEPS.length - 1 ? 'COMEÇAR AGORA' : 'PRÓXIMO'}
             <ChevronRight size={20} />
           </button>
           
           {currentStep < STEPS.length - 1 && (
             <button 
               onClick={() => {
                 localStorage.setItem('onboarding_seen', 'true')
                 setVisible(false)
                 if (onComplete) onComplete()
               }}
               style={{
                 width: '100%',
                 background: 'transparent',
                 color: '#555',
                 border: 'none',
                 padding: '16px',
                 fontSize: '0.875rem',
                 marginTop: '10px',
                 cursor: 'pointer',
                 fontWeight: 600,
                 textTransform: 'uppercase',
                 letterSpacing: '1px'
               }}
             >
               Pular Introdução
             </button>
           )}
        </div>
      </div>
    </div>
  )
}
