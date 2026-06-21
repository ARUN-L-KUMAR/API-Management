import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Skeleton, TableSkeleton, CardsSkeleton, MetricSkeleton } from '@/components/ui/Skeleton'

describe('Skeleton', () => {
  it('renders with default variant', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('renders circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />)
    expect(container.firstChild).toHaveClass('rounded-full')
  })

  it('renders rectangular variant', () => {
    const { container } = render(<Skeleton variant="rectangular" />)
    expect(container.firstChild).toHaveClass('rounded-lg')
  })

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width={100} height={50} />)
    expect(container.firstChild).toHaveStyle({ width: '100px', height: '50px' })
  })
})

describe('TableSkeleton', () => {
  it('renders specified number of rows', () => {
    const { container } = render(<TableSkeleton rows={3} cols={4} />)
    const rows = container.querySelectorAll('.divide-y > div')
    expect(rows.length).toBe(3)
  })
})

describe('CardsSkeleton', () => {
  it('renders specified number of cards', () => {
    const { container } = render(<CardsSkeleton count={4} />)
    const grid = container.firstChild
    expect(grid).toHaveClass('grid')
    const cards = container.querySelectorAll('.glass-panel')
    expect(cards.length).toBe(4)
  })
})

describe('MetricSkeleton', () => {
  it('renders 4 metric placeholders', () => {
    const { container } = render(<MetricSkeleton />)
    const grid = container.firstChild
    expect(grid).toHaveClass('grid')
    const items = container.querySelectorAll('.glass-panel')
    expect(items.length).toBe(4)
  })
})
