import { useConfiguracoes } from '@/hooks/useConfiguracoes'

interface AppIconProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { container: 'w-7 h-7 rounded-lg', text: 'text-sm', img: 'text-sm' },
  md: { container: 'w-9 h-9 rounded-xl', text: 'text-xl', img: 'text-xl' },
  lg: { container: 'w-16 h-16 rounded-2xl', text: 'text-4xl', img: 'text-4xl' },
}

export function AppIcon({ size = 'md', className = '' }: AppIconProps) {
  const { iconeApp, iconeUrl } = useConfiguracoes()
  const s = sizeMap[size]

  return (
    <div
      className={`${s.container} bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0 overflow-hidden ${className}`}
    >
      {iconeUrl ? (
        <img src={iconeUrl} alt="ícone" className="w-full h-full object-cover" />
      ) : (
        <span className={`${s.text} leading-none`}>{iconeApp || '🍽️'}</span>
      )}
    </div>
  )
}
