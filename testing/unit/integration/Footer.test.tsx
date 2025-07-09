import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

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

describe('Footer Integration Test', () => {
  test('renders footer with correct information', () => {
    render(<Footer />);
    
    // Check logo and name
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check for footer description
    expect(screen.getByText(/Full-stack developer/)).toBeInTheDocument();
    
    // Check for current year in copyright
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(`© ${currentYear} John Doe`))).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    render(<Footer />);
    
    // Check navigation links
    const navigationLinks = ['Home', 'About', 'Projects', 'Blog', 'Contact'];
    
    navigationLinks.forEach(link => {
      expect(screen.getByText(link)).toBeInTheDocument();
    });
  });

  test('renders legal links', () => {
    render(<Footer />);
    
    // Check legal links
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
  });

  it('renders social media links', () => {
    const footerProps = {
      profileData: {
        socialLinks: {
          github: 'https://github.com',
          linkedin: 'https://linkedin.com'
        }
      }
    };

    render(<Footer {...footerProps} />);

    const githubLink = screen.getByLabelText('GitHub');
    const linkedinLink = screen.getByLabelText('LinkedIn');

    expect(githubLink).toBeInTheDocument();
    expect(linkedinLink).toBeInTheDocument();

    expect(githubLink).toHaveAttribute('href', 'https://github.com');
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com');
  });
}); 