'use client'

interface SkeletonCardProps {
  isDark?: boolean
  count?: number
}

export default function SkeletonCard({ isDark = true, count = 3 }: SkeletonCardProps) {
  const cardBg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const imageBg = isDark ? 'bg-gray-800' : 'bg-gray-100'
  const lineBg = isDark ? 'bg-gray-800' : 'bg-gray-200'

  return (
    <div role="status" aria-busy="true" className="space-y-4">
      <span className="sr-only">Carregando doações...</span>

      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={`rounded-2xl border overflow-hidden shadow-md animate-pulse ${cardBg}`}
        >
          {/* Simula a imagem do alimento */}
          <div className={`h-32 ${imageBg}`} />

          {/* Simula o conteúdo do card */}
          <div className="p-4 space-y-3">
            <div className={`h-5 w-2/3 rounded-lg ${lineBg}`} />
            <div className={`h-4 w-1/2 rounded-lg ${lineBg}`} />
            <div className={`h-4 w-4/5 rounded-lg ${lineBg}`} />
            <div className={`h-10 w-full rounded-lg ${lineBg}`} />
          </div>
        </div>
      ))}
    </div>
  )
}