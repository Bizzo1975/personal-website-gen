import React from 'react';
import { render } from '@testing-library/react';
import AnimatedElement, { createStaggeredChildren } from '@/components/AnimatedElement';
import { motion } from 'framer-motion';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: jest.fn().mockImplementation(({ children, ...props }) => (
      <div data-testid="motion-div" {...props}>{children}</div>
    )),
    span: jest.fn().mockImplementation(({ children, ...props }) => (
      <span data-testid="motion-span" {...props}>{children}</span>
    )),
  },
}));

describe('AnimatedElement Component', () => {
  test('renders children correctly', () => {
    const { getByText } = render(
      <AnimatedElement>Test Content</AnimatedElement>
    );
    
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  test('applies className correctly', () => {
    const { getByTestId } = render(
      <AnimatedElement className="test-class">Content</AnimatedElement>
    );
    
    const element = getByTestId('motion-div');
    expect(element).toHaveClass('test-class');
  });

  test('supports custom element types', () => {
    const { getByTestId } = render(
      <AnimatedElement as="span">Span Content</AnimatedElement>
    );
    
    expect(getByTestId('motion-span')).toBeInTheDocument();
  });

  test('passes animation variants correctly', () => {
    const { getByTestId } = render(
      <AnimatedElement type="fadeIn">Content</AnimatedElement>
    );
    
    const element = getByTestId('motion-div');
    expect(element).toHaveAttribute('initial');
    expect(element).toHaveAttribute('animate');
  });

  test('applies delay correctly', () => {
    const { getByTestId } = render(
      <AnimatedElement delay={0.5}>Content</AnimatedElement>
    );
    
    const element = getByTestId('motion-div');
    expect(element).toHaveAttribute('transition');
  });

  test('createStaggeredChildren creates elements with staggered animations', () => {
    const children = [
      <div key="1">Child 1</div>,
      <div key="2">Child 2</div>,
      <div key="3">Child 3</div>
    ];
    
    const { getAllByTestId } = render(
      <div>{createStaggeredChildren(children)}</div>
    );
    
    const elements = getAllByTestId('motion-div');
    expect(elements).toHaveLength(3);
  });
}); 