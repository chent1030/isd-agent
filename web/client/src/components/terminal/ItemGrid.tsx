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
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">当前分类</p>
          <h2 className="truncate text-3xl font-black tracking-normal text-slate-950">
            {selectedCategory?.name || '选择物品'}
          </h2>
        </div>
        <Button variant="outline" size="xl" onClick={onBack}>
          <ArrowLeft />
          返回分类
        </Button>
      </div>

      {loading ? (
        <div className="grid min-h-0 flex-1 auto-rows-[238px] grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 overflow-y-auto pb-2 pr-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 text-lg font-medium text-slate-500">
          当前分类暂无可用物品
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 auto-rows-[238px] grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 overflow-y-auto pb-2 pr-1">
          {items.map(item => (
            <ItemCard key={item.id} item={item} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
})
