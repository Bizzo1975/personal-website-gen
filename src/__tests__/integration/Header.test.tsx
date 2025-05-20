import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/Header';

// Mock the next/link component
jest.mock('next/link', () => {
  return ({ children, href, ...rest }: any) => {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ 
    data: null, 
    status: 'unauthenticated' 
  })),
  signOut: jest.fn()
}));

// Mock ThemeSwitcher component
jest.mock('@/components/ThemeSwitcher', () => {
  return () => <button aria-label="Toggle theme">Toggle Theme</button>;
});

describe('Header Integration Test', () => {
  test('renders header with navigation links', () => {
    render(<Header />);
    
    // Check logo and name
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check navigation links
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  test('renders login/signup links when not authenticated', () => {
    render(<Header />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Signup')).toBeInTheDocument();
  });

  test('toggles mobile menu on button click', () => {
    const { container } = render(<Header />);
    
    // Get the mobile menu button
    const menuButton = screen.getByLabelText('Toggle mobile menu');
    
    // Menu should be closed initially
    expect(container.querySelector('nav.md\\:hidden')).not.toBeInTheDocument();
    
    // Open the menu
    fireEvent.click(menuButton);
    
    // Menu should be open
    expect(container.querySelector('nav.md\\:hidden')).toBeInTheDocument();
    
    // Close the menu
    fireEvent.click(menuButton);
    
    // Menu should be closed again
    expect(container.querySelector('nav.md\\:hidden')).not.toBeInTheDocument();
  });
}); 