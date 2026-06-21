import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Input, Select } from '@/components/ui/Input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" id="email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(<Input label="Email" error="Required field" />)
    expect(screen.getByText('Required field')).toBeInTheDocument()
  })

  it('calls onChange when typed into', async () => {
    const onChange = vi.fn()
    render(<Input label="Name" id="name" onChange={onChange} />)
    const input = screen.getByLabelText('Name')
    await userEvent.type(input, 'hello')
    expect(onChange).toHaveBeenCalled()
  })
})

describe('Select', () => {
  it('renders with label and options', () => {
    render(
      <Select label="Provider" id="provider">
        <option value="openai">OpenAI</option>
        <option value="gemini">Gemini</option>
      </Select>
    )
    expect(screen.getByLabelText('Provider')).toBeInTheDocument()
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('Gemini')).toBeInTheDocument()
  })
})
