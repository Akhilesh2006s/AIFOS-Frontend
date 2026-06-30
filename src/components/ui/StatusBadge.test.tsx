import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders status text with underscores replaced', () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText('in progress')).toBeInTheDocument();
  });

  it('applies success variant for approved', () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText('approved')).toHaveClass('badge-success');
  });

  it('falls back to neutral for unknown status', () => {
    render(<StatusBadge status="custom_state" />);
    expect(screen.getByText('custom state')).toHaveClass('badge-neutral');
  });

  it('renders optional dot indicator', () => {
    const { container } = render(<StatusBadge status="active" dot />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
