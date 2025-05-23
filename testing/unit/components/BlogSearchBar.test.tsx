import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlogSearchBar from '@/components/BlogSearchBar';

describe('BlogSearchBar Component', () => {
  const mockOnSearch = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly with default props', () => {
    render(<BlogSearchBar onSearch={mockOnSearch} />);
    
    // Check if search input is rendered
    const searchInput = screen.getByPlaceholderText('Search blog posts...');
    expect(searchInput).toBeInTheDocument();
    
    // Clear button should not be visible initially
    const clearButton = screen.queryByLabelText('Clear search');
    expect(clearButton).not.toBeInTheDocument();
  });
  
  it('renders with initial query', () => {
    render(<BlogSearchBar onSearch={mockOnSearch} initialQuery="test query" />);
    
    // Input should have the initial value
    const searchInput = screen.getByPlaceholderText('Search blog posts...');
    expect(searchInput).toHaveValue('test query');
    
    // Clear button should be visible with initial query
    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
  });
  
  it('calls onSearch when user types', async () => {
    const user = userEvent.setup();
    render(<BlogSearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Search blog posts...');
    await user.type(searchInput, 'react');
    
    // onSearch should be called with the typed value
    expect(mockOnSearch).toHaveBeenCalledWith('react');
    
    // Clear button should now be visible
    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
  });
  
  it('clears search when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<BlogSearchBar onSearch={mockOnSearch} initialQuery="test" />);
    
    // Clear button should be visible
    const clearButton = screen.getByLabelText('Clear search');
    
    // Click the clear button
    await user.click(clearButton);
    
    // Input should be cleared
    const searchInput = screen.getByPlaceholderText('Search blog posts...');
    expect(searchInput).toHaveValue('');
    
    // onSearch should be called with empty string
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });
  
  it('clears search when Enter key is pressed on clear button', async () => {
    render(<BlogSearchBar onSearch={mockOnSearch} initialQuery="test" />);
    
    // Clear button should be visible
    const clearButton = screen.getByLabelText('Clear search');
    
    // Press Enter key on clear button
    fireEvent.keyDown(clearButton, { key: 'Enter', code: 'Enter' });
    
    // Input should be cleared
    const searchInput = screen.getByPlaceholderText('Search blog posts...');
    expect(searchInput).toHaveValue('');
    
    // onSearch should be called with empty string
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });
  
  it('has proper accessibility attributes', () => {
    render(<BlogSearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText('Search blog posts...');
    expect(searchInput).toHaveAttribute('aria-label', 'Search blog posts');
  });
});
