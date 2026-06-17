import { memo } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { CabinetCatalogItem, CabinetCategory } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ITEM_ACCENTS, getDisplayInitial, useTypeLabel } from '@/lib/shared'

interface ItemGridProps {
  items: CabinetCatalogItem[]
  loading: boolean
  selectedCategory: CabinetCategory | null
  onBack: () => void
  onSelect: (item: CabinetCatalogItem) => void
}

const ItemCard = memo(function ItemCard({
  item,
  onSelect,
}: {
  item: CabinetCatalogItem
  onSelect: (item: CabinetCatalogItem) => void
}) {
  const accent = ITEM_ACCENTS[Math.abs(Number(item.id) || 0) % ITEM_ACCENTS.length]
  const disabled = item.cabinetQuantity <= 0

  return (
    <button
      type="button"
      disabled={disabled}
      className="group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-xl border bg-card p-5 pl-7 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      onClick={() => onSelect(item)}
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-start justify-between gap-3">
        <Badge variant="secondary">{useTypeLabel(item.useType)}</Badge>
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-lg text-xl font-extrabold text-white shadow-sm"
          style={{ backgroundColor: accent }}
        >
          {getDisplayInitial(item.name)}
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-lg font-bold text-foreground">{item.name}</h3>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{item.spec || '无规格'}</p>
      </div>
      <div className="mt-auto flex items-baseline gap-1.5">
        <span className="text-xs text-muted-foreground">格口内</span>
        <span className="text-2xl font-extrabold text-foreground">{item.cabinetQuantity}</span>
        {item.authRequired && <Badge variant="warning" className="ml-auto">需授权</Badge>}
      </div>
    </button>
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-muted-foreground">当前类别暂无可用物品</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-2 pr-1 sm:grid-cols-3 lg:grid-cols-4">
          {items.map(item => (
            <ItemCard key={item.id} item={item} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
})
