import { memo } from 'react'
import type { CabinetCategory } from '@/types/api'
import { GlassCategoryCard } from '@/components/ui/glass-category-card'
import { Skeleton } from '@/components/ui/skeleton'
import { CATEGORY_ACCENTS } from '@/lib/shared'

interface CategoryGridProps {
  categories: CabinetCategory[]
  loading: boolean
  onSelect: (categoryId: string) => void
}

export const CategoryGrid = memo(function CategoryGrid({ categories, loading, onSelect }: CategoryGridProps) {
  if (loading) {
    return (
      <div className="grid h-full grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-full min-h-[260px] rounded-lg" />
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 text-lg font-medium text-slate-500">
        暂无分类数据
      </div>
    )
  }

  return (
    <div className="grid h-full grid-cols-3 gap-5">
      {categories.map((category, index) => (
        <GlassCategoryCard
          key={category.id}
          name={category.name}
          itemCount={category.itemCount}
          accent={CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length]}
          index={index}
          tags={[`${category.itemCount} 种物品`]}
          onSelect={() => onSelect(category.id)}
          className="h-full min-h-0"
        />
      ))}
    </div>
  )
})
