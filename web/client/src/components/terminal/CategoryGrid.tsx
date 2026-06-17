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
      <div className="grid grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[340px] rounded-2xl" />
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
    <div className="flex flex-wrap justify-center gap-5">
      {categories.map((category, index) => (
        <GlassCategoryCard
          key={category.id}
          name={category.name}
          itemCount={category.itemCount}
          accent={CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length]}
          index={index}
          tags={[`${category.itemCount} 种`]}
          onSelect={() => onSelect(category.id)}
          className="w-full max-w-[360px] flex-1 basis-[280px]"
        />
      ))}
    </div>
  )
})
