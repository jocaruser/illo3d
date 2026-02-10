import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Log in</Button>);
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Submit</Button>);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Submit
      </Button>
    );
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies variant and size classes', () => {
    const { container } = render(
      <Button variant="primary" size="lg">
        Save
      </Button>
    );
    const btn = container.querySelector('button');
    expect(btn?.className).toMatch(/primary/);
    expect(btn?.className).toMatch(/lg/);
  });

  it('defaults to default variant and md size', () => {
    const { container } = render(<Button>OK</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toMatch(/default/);
    expect(btn?.className).toMatch(/md/);
  });
});
