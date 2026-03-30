import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WorkoutApp',
    short_name: 'Workout',
    description: 'Seu treino, sua regra - App de treinos personalizados',
    start_url: '/home',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    id: 'workoutapp-v2', // Força o navegador a ver como um "app novo" e atualizar o ícone
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      }
    ],
  }
}
