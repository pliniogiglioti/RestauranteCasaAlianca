import { useConfiguracoes } from '@/hooks/useConfiguracoes'

interface AppIconProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { text: 'text-xl',  img: 'w-7 h-7' },
  md: { text: 'text-2xl', img: 'w-9 h-9' },
  lg: { text: 'text-6xl', img: 'w-20 h-20' },
}

export function AppIcon({ size = 'md', className = '' }: AppIconProps) {
  const { iconeApp, iconeUrl } = useConfiguracoes()
  const s = sizeMap[size]

  if (iconeUrl) {
    return (
      <img
        src={iconeUrl}
        alt="ícone"
        className={`${s.img} object-contain shrink-0 ${className}`}
      />
    )
  }

  return (
    <span className={`${s.text} leading-none shrink-0 ${className}`}>
      {iconeApp || '🍽️'}
    </span>
  )
}
