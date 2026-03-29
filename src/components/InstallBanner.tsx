'use client'
import { useState, useEffect } from 'react'
import { X, Smartphone, Download } from 'lucide-react'

export function InstallBanner() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Detecta se já está no modo standalone (instalado)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    if (standalone) return

    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
    setIsIOS(ios)

    // iOS: mostra banner se não estiver instalado
    if (ios) {
      const dismissed = localStorage.getItem('pwa-banner-dismissed')
      if (!dismissed) setShow(true)
      return
    }

    // Android/Desktop: evento beforeinstallprompt
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = localStorage.getItem('pwa-banner-dismissed')
      if (!dismissed) setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setShow(false)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-banner-dismissed', '1')
  }

  if (!show) return null

  return (
    <div style={styles.banner}>
      <div style={styles.iconContainer}>
        <Smartphone size={24} color="#c8f135" />
      </div>
      <div style={styles.content}>
        <h4 style={styles.title}>INSTALE O WORKOUT APP</h4>
        <p style={styles.text}>
          {isIOS
            ? "Toque em Compartilhar → 'Adicionar à Tela de Início' para ativar notificações no iPhone."
            : "Instale o app para receber notificações mesmo com o navegador fechado."}
        </p>
        {!isIOS && deferredPrompt && (
          <button style={styles.installBtn} onClick={handleInstall}>
            <Download size={14} /> Instalar agora
          </button>
        )}
      </div>
      <button style={styles.closeBtn} onClick={handleDismiss}>
        <X size={18} color="#555" />
      </button>
    </div>
  )
}

const styles = {
  banner: {
    position: 'fixed' as const,
    bottom: '80px',
    left: '16px',
    right: '16px',
    background: '#161616',
    border: '1px solid #222',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
    zIndex: 9999,
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  iconContainer: {
    width: '44px',
    height: '44px',
    background: '#1a2a00',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: {
    fontFamily: 'Barlow Condensed, sans-serif',
    fontWeight: 800,
    fontSize: '14px',
    color: '#f0f0f0',
    margin: '0 0 4px 0',
  },
  text: {
    fontFamily: 'Barlow, sans-serif',
    fontSize: '12px',
    color: '#888',
    margin: 0,
    lineHeight: '1.4',
  },
  installBtn: {
    marginTop: '8px',
    background: '#c8f135',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '11px',
    fontFamily: 'Barlow Condensed, sans-serif',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textTransform: 'uppercase' as const,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  }
}
