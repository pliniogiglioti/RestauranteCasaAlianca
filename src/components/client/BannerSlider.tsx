import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Banner } from '@/types'

interface BannerSliderProps {
  banners: Banner[]
}

export function BannerSlider({ banners }: BannerSliderProps) {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const next = useCallback(() => {
    if (isTransitioning || banners.length <= 1) return
    setIsTransitioning(true)
    setCurrent((c) => (c + 1) % banners.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }, [banners.length, isTransitioning])

  const prev = useCallback(() => {
    if (isTransitioning || banners.length <= 1) return
    setIsTransitioning(true)
    setCurrent((c) => (c - 1 + banners.length) % banners.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }, [banners.length, isTransitioning])

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(next, 4500)
    return () => clearInterval(interval)
  }, [next, banners.length])

  if (banners.length === 0) return null

  return (
    <div className="relative overflow-hidden rounded-2xl mx-4 shadow-lg">
      {/* Slides */}
      <div className="relative aspect-[16/7] sm:aspect-[16/6]">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={b.imagem_url}
              alt={b.titulo}
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Text content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <h2 className="text-white font-bold text-lg sm:text-2xl font-display leading-tight drop-shadow-md">
                {b.titulo}
              </h2>
              {b.subtitulo && (
                <p className="text-white/85 text-sm sm:text-base mt-1 drop-shadow">
                  {b.subtitulo}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-5 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
