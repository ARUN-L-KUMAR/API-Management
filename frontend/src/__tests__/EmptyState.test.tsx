import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { EmptyState } from '@/components/ui/EmptyState'
import { Key } from 'lucide-react'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        icon={<Key className="w-12 h-12" />}
        title="No items found"
        description="Try adjusting your filters."
      />
    )
    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your filters.')).toBeInTheDocument()
  })

  it('renders action button when provided', async () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        icon={<Key className="w-12 h-12" />}
        title="Empty"
        action={{ label: 'Add Item', onClick }}
      />
    )
    const button = screen.getByRole('button', { name: /add item/i })
    expect(button).toBeInTheDocument()
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not render action button when not provided', () => {
    render(
      <EmptyState
        icon={<Key className="w-12 h-12" />}
        title="Empty"
      />
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
