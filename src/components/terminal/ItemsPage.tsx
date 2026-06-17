import React, { memo } from 'react'
import type { CabinetCatalogItem, CabinetCategory } from '../../types/electron'
import { getDisplayInitial, ITEM_ACCENTS, useTypeLabel } from './shared'

interface ItemCardProps {
  item: CabinetCatalogItem
  onSelect: (item: CabinetCatalogItem) => void
}

const ItemCard = memo(function ItemCard({
  item,
  onSelect,
}: ItemCardProps) {
  return (
    <button
      type="button"
      className="catalog-item-card"
      style={{ '--card-accent': ITEM_ACCENTS[Math.abs(Number(item.id) || 0) % ITEM_ACCENTS.length] } as React.CSSProperties}
      disabled={item.cabinetQuantity <= 0}
      onClick={() => onSelect(item)}
    >
      <span>{useTypeLabel(item.useType)}</span>
      <strong>{item.name}</strong>
      <em>{item.spec || '无规格'}</em>
      <div>
        <b><small>格口内数量</small>{item.cabinetQuantity}</b>
      </div>
      <i>{getDisplayInitial(item.name)}</i>
    </button>
  )
})

interface ItemsPageProps {
  items: CabinetCatalogItem[]
  loading: boolean
  selectedCategory: CabinetCategory | null
  onBack: () => void
  onSelectItem: (item: CabinetCatalogItem) => void
}

export const ItemsPage = memo(function ItemsPage({
  items,
  loading,
  selectedCategory,
  onBack,
  onSelectItem,
}: ItemsPageProps) {
  return (
    <div className="terminal-page">
      <div className="terminal-page-header">
        <div>
          <h2>{selectedCategory?.name || '选择物品'}</h2>
        </div>
        <div className="terminal-page-actions">
          <button type="button" className="twin-secondary-action" onClick={onBack}>返回类别</button>
        </div>
      </div>
      <div className="catalog-item-panel">
        {loading ? (
          <div className="catalog-loading-state">
            <span className="terminal-loading-spinner" />
            <strong>正在加载物品</strong>
          </div>
        ) : items.length === 0 ? (
          <div className="catalog-empty-state">当前类别暂无可用物品</div>
        ) : items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            onSelect={onSelectItem}
          />
        ))}
      </div>
    </div>
  )
})
