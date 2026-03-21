import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import minimalFixture from './fixtures/minimal_review_response.json'

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const u = String(input)
        if (u.endsWith('/health')) {
          return new Response(JSON.stringify({ status: 'healthy' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (u.endsWith('/review')) {
          return new Response(JSON.stringify(minimalFixture), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response('not found', { status: 404 })
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows API healthy and review summary after submit', async () => {
    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/healthy/i)
    })
    await user.clear(screen.getByLabelText(/source code/i))
    await user.type(screen.getByLabelText(/source code/i), 'def x():\n    pass\n')
    await user.click(screen.getByRole('button', { name: /run review/i }))
    await waitFor(() => {
      expect(screen.getByText(minimalFixture.summary)).toBeInTheDocument()
    })
    expect(screen.getByText(/overall score/i)).toBeInTheDocument()
  })

  it('renders 422 validation errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const u = String(input)
        if (u.endsWith('/health')) {
          return new Response(JSON.stringify({ status: 'healthy' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (u.endsWith('/review')) {
          return new Response(
            JSON.stringify({
              detail: [
                {
                  type: 'missing',
                  loc: ['body', 'code'],
                  msg: 'Field required',
                },
              ],
            }),
            { status: 422, headers: { 'Content-Type': 'application/json' } }
          )
        }
        return new Response('', { status: 404 })
      })
    )

    const user = userEvent.setup()
    render(<App />)
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/healthy/i)
    })
    await user.click(screen.getByRole('button', { name: /run review/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(screen.getByText(/body\.code/i)).toBeInTheDocument()
  })
})
