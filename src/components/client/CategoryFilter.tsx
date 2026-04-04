import type { Categoria } from '@/types'

interface CategoryFilterProps {
  categorias: Categoria[]
  selected: string | null
  onSelect: (id: string | null) => void
}

export function CategoryFilter({ categorias, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="px-4">
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
        {/* All */}
        <button
          onClick={() => onSelect(null)}
          className={`
            flex-none flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200 whitespace-nowrap border
            ${
              selected === null
                ? 'bg-brand-500 text-white border-brand-500 shadow-sm shadow-brand-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600'
            }
          `}
        >
          🍽️ Todos
        </button>

        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`
              flex-none flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200 whitespace-nowrap border
              ${
                selected === cat.id
                  ? 'bg-brand-500 text-white border-brand-500 shadow-sm shadow-brand-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600'
              }
            `}
          >
            {cat.icone && <span>{cat.icone}</span>}
            {cat.nome}
          </button>
        ))}
      </div>
    </div>
  )
}
