import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ScoreBadge from './ScoreBadge';
import React from 'react';

describe('ScoreBadge', () => {
  it('renders "Strong" for scores above 70', () => {
    render(<ScoreBadge score={75} />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.getByText('Strong').closest('div')).toHaveClass('bg-badge-green');
  });

  it('renders "Average" for scores between 40 and 69', () => {
    render(<ScoreBadge score={60} />);
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.getByText('Average').closest('div')).toHaveClass('bg-badge-yellow');
  });

  it('renders "Poor" for scores below 40', () => {
    render(<ScoreBadge score={30} />);
    expect(screen.getByText('Poor')).toBeInTheDocument();
    expect(screen.getByText('Poor').closest('div')).toHaveClass('bg-badge-red');
  });
});
