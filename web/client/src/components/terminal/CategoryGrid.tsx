import { memo } from 'react'
import type { CabinetCategory } from '@/types/api'
import { Card } from '@/components/ui/card'
import { CATEGORY_ACCENTS, getDisplayInitial } from '@/lib/shared'
import { Skeleton } from '@/components/ui/skeleton'

interface CategoryGridProps {
  categories: CabinetCategory[]
  loading: boolean
  onSelect: (categoryId: string) => void
}

const CategoryCard = memo(function CategoryCard({
  category,
  index,
  onSelect,
}: {
  category: CabinetCategory
  index: number
  onSelect: (id: string) => void
}) {
  const accent = CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length]
  return (
    <button
      type="button"
      className="group relative flex min-h-[180px] cursor-pointer flex-col justify-between overflow-hidden rounded-xl border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      onClick={() => onSelect(category.id)}
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-start justify-between gap-3 pl-3">
        <span
          className="flex size-16 shrink-0 items-center justify-center rounded-lg text-3xl font-extrabold text-white shadow-sm"
          style={{ backgroundColor: accent }}
        >
          {getDisplayInitial(category.name)}
        </span>
      </div>
      <div className="pl-3">
        <h3 className="text-2xl font-bold leading-tight text-foreground">{category.name}</h3>
        <p className="mt-1 text-sm font-medium text-muted-foreground">{category.itemCount} 种物品</p>
      </div>
    </button>
  )
})

export const CategoryGrid = memo(function CategoryGrid({ categories, loading, onSelect }: CategoryGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[180px] rounded-xl" />
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">暂无类别</div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category, index) => (
        <CategoryCard key={category.id} category={category} index={index} onSelect={onSelect} />
      ))}
    </div>
  )
})
