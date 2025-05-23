import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ContactPage from '@/app/contact/page';

describe('Contact Form Integration Test', () => {
  test('renders contact form with correct fields', () => {
    render(<ContactPage />);
    
    // Check page heading
    expect(screen.getByText('Contact Me')).toBeInTheDocument();
    
    // Check form elements
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
    expect(screen.getByText('Send Message')).toBeInTheDocument();
  });

  test('displays contact information', () => {
    render(<ContactPage />);
    
    // Check for contact info
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  test('has social media links', () => {
    render(<ContactPage />);
    
    // Check for social media links
    const links = screen.getAllByRole('link');
    
    // Filter links to social media (GitHub, LinkedIn, Twitter)
    const socialLinks = links.filter(link => {
      const href = link.getAttribute('href');
      return href?.includes('github.com') || 
             href?.includes('linkedin.com') || 
             href?.includes('twitter.com');
    });
    
    // Should have 3 social media links
    expect(socialLinks).toHaveLength(3);
    
    // Each should open in a new tab
    socialLinks.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  test('validates required form fields', () => {
    render(<ContactPage />);
    
    // Try to submit without filling required fields
    const submitButton = screen.getByText('Send Message');
    fireEvent.click(submitButton);
    
    // Get all input fields
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const subjectInput = screen.getByLabelText('Subject');
    const messageInput = screen.getByLabelText('Message');
    
    // Check HTML5 validation (required attribute)
    expect(nameInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('required');
    expect(subjectInput).toHaveAttribute('required');
    expect(messageInput).toHaveAttribute('required');
  });
}); 