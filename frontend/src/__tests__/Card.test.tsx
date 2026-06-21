import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Card content</p></Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies glass panel classes', () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.firstChild).toHaveClass('glass-panel')
  })

  it('applies hover styles by default', () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.firstChild).toHaveClass('hover:border-purple-500/30')
  })

  it('removes hover styles when hover=false', () => {
    const { container } = render(<Card hover={false}>Content</Card>)
    expect(container.firstChild).not.toHaveClass('hover:border-purple-500/30')
  })
})

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader><h3>Title</h3></CardHeader>)
    expect(screen.getByText('Title')).toBeInTheDocument()
  })
})

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent><p>Body</p></CardContent>)
    expect(screen.getByText('Body')).toBeInTheDocument()
  })
})
