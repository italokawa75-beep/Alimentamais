'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redireciona automaticamente para a tela de login
    router.push('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-purple-400 font-bold text-xl animate-pulse flex items-center gap-2">
        🍽️ Alimetamais - Redirecionando...
      </div>
    </div>
  )
}