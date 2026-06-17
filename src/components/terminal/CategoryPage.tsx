import React, { memo } from 'react'
import type { CabinetCategory } from '../../types/electron'
import { CATEGORY_ACCENTS, getDisplayInitial } from './shared'

interface CategoryCardProps {
  category: CabinetCategory
  index: number
  onSelect: (categoryId: string) => void
}

const CategoryCard = memo(function CategoryCard({
  category,
  index,
  onSelect,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      className="catalog-category"
      style={{ '--card-accent': CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length] } as React.CSSProperties}
      onClick={() => onSelect(category.id)}
    >
      <i>{getDisplayInitial(category.name)}</i>
      <strong>{category.name}</strong>
      <em>{category.itemCount} 种物品</em>
    </button>
  )
})

interface CategoryPageProps {
  categories: CabinetCategory[]
  onSelectCategory: (categoryId: string) => void
}

export const CategoryPage = memo(function CategoryPage({
  categories,
  onSelectCategory,
}: CategoryPageProps) {
  return (
    <div className="terminal-page terminal-category-page">
      <div className="catalog-category-panel">
        {categories.length === 0 ? (
          <div className="catalog-empty-state">暂无类别</div>
        ) : categories.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            index={index}
            onSelect={onSelectCategory}
          />
        ))}
      </div>
    </div>
  )
})
