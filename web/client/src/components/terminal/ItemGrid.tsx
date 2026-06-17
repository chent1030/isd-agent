import { memo } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { CabinetCatalogItem, CabinetCategory } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GradientItemCard, type ItemCardGradient } from '@/components/ui/gradient-item-card'
import { ITEM_ACCENTS, useTypeLabel } from '@/lib/shared'

interface ItemGridProps {
  items: CabinetCatalogItem[]
  loading: boolean
  selectedCategory: CabinetCategory | null
  onBack: () => void
  onSelect: (item: CabinetCatalogItem) => void
}

// accent 颜色 → gradient 变体映射
const ACCENT_TO_GRADIENT: ItemCardGradient[] = ['green', 'gray', 'orange', 'purple']

const ItemCard = memo(function ItemCard({
  item,
  onSelect,
}: {
  item: CabinetCatalogItem
  onSelect: (item: CabinetCatalogItem) => void
}) {
  const colorIndex = Math.abs(Number(item.id) || 0) % ITEM_ACCENTS.length
  const accent = ITEM_ACCENTS[colorIndex]
  const gradient = ACCENT_TO_GRADIENT[colorIndex % ACCENT_TO_GRADIENT.length]
  const disabled = item.cabinetQuantity <= 0

  return (
    <GradientItemCard
      name={item.name}
      spec={item.spec}
      typeLabel={useTypeLabel(item.useType)}
      quantity={item.cabinetQuantity}
      authRequired={item.authRequired}
      accent={accent}
      badgeText={useTypeLabel(item.useType)}
      gradient={gradient}
      disabled={disabled}
      ctaText={item.useType === 1 ? '选择借用' : '选择领用'}
      onSelect={() => onSelect(item)}
    />
  )
})

export const ItemGrid = memo(function ItemGrid({
  items,
  loading,
  selectedCategory,
  onBack,
  onSelect,
}: ItemGridProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">{selectedCategory?.name || '选择物品'}</h2>
        <Button variant="outline" size="lg" onClick={onBack}>
          <ArrowLeft />
          返回类别
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5 overflow-y-auto pb-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[260px] rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">当前类别暂无可用物品</div>
      ) : (
        <div className="grid grid-cols-2 gap-5 overflow-y-auto pb-2 pr-1 sm:grid-cols-3 lg:grid-cols-4">
          {items.map(item => (
            <ItemCard key={item.id} item={item} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
})
