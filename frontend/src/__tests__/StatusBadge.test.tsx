import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusBadge, ModelVerificationBadge } from '@/components/ui/StatusBadge'

describe('StatusBadge', () => {
  it('renders Working status', () => {
    render(<StatusBadge status="Working" />)
    expect(screen.getByText('Working')).toBeInTheDocument()
  })

  it('renders Quota Exceeded status', () => {
    render(<StatusBadge status="Quota Exceeded" />)
    expect(screen.getByText('Quota Over')).toBeInTheDocument()
  })

  it('renders Invalid status', () => {
    render(<StatusBadge status="Invalid" />)
    expect(screen.getByText('Invalid')).toBeInTheDocument()
  })

  it('renders Unauthorized as Invalid', () => {
    render(<StatusBadge status="Unauthorized" />)
    expect(screen.getByText('Invalid')).toBeInTheDocument()
  })

  it('renders Rate Limited status', () => {
    render(<StatusBadge status="Rate Limited" />)
    expect(screen.getByText('Limited')).toBeInTheDocument()
  })

  it('renders unknown status', () => {
    render(<StatusBadge status="Unknown" />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})

describe('ModelVerificationBadge', () => {
  it('renders Working status', () => {
    render(<ModelVerificationBadge status="Working" />)
    expect(screen.getByText('WORKING')).toBeInTheDocument()
  })

  it('renders Failed status', () => {
    render(<ModelVerificationBadge status="Failed" />)
    expect(screen.getByText('FAILED')).toBeInTheDocument()
  })

  it('renders Deprecated status', () => {
    render(<ModelVerificationBadge status="Deprecated" />)
    expect(screen.getByText('DEPRECATED')).toBeInTheDocument()
  })
})
