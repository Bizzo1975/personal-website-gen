import React from 'react';
import { render, screen } from '@testing-library/react';
import Card, { CardHeader, CardBody, CardFooter } from '@/components/Card';

describe('Card Component', () => {
  test('renders card with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  test('applies default variant classes', () => {
    render(<Card>Default Card</Card>);
    const card = screen.getByText('Default Card').parentElement;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('dark:bg-slate-900');
    expect(card).toHaveClass('shadow-tech');
  });

  test('applies elevated variant classes', () => {
    render(<Card variant="elevated">Elevated Card</Card>);
    const card = screen.getByText('Elevated Card').parentElement;
    expect(card).toHaveClass('shadow-tech-lg');
  });

  test('applies bordered variant classes', () => {
    render(<Card variant="bordered">Bordered Card</Card>);
    const card = screen.getByText('Bordered Card').parentElement;
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-slate-200');
    expect(card).toHaveClass('dark:border-slate-800');
  });

  test('applies additional className passed as prop', () => {
    render(<Card className="custom-class">Custom Card</Card>);
    const card = screen.getByText('Custom Card').parentElement;
    expect(card).toHaveClass('custom-class');
  });

  test('renders CardHeader with proper styling', () => {
    render(<CardHeader>Header Content</CardHeader>);
    const header = screen.getByText('Header Content').parentElement;
    expect(header).toHaveClass('px-6');
    expect(header).toHaveClass('py-4');
    expect(header).toHaveClass('border-b');
  });

  test('renders CardBody with proper styling', () => {
    render(<CardBody>Body Content</CardBody>);
    const body = screen.getByText('Body Content').parentElement;
    expect(body).toHaveClass('px-6');
    expect(body).toHaveClass('py-4');
  });

  test('renders CardFooter with proper styling', () => {
    render(<CardFooter>Footer Content</CardFooter>);
    const footer = screen.getByText('Footer Content').parentElement;
    expect(footer).toHaveClass('px-6');
    expect(footer).toHaveClass('py-4');
    expect(footer).toHaveClass('border-t');
  });

  test('renders a complete card with header, body, and footer', () => {
    render(
      <Card>
        <CardHeader>Card Title</CardHeader>
        <CardBody>Card Content</CardBody>
        <CardFooter>Card Actions</CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Card Actions')).toBeInTheDocument();
  });
}); 