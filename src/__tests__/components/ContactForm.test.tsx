import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from '@/components/ContactForm';

// Mock the ReCaptcha component
jest.mock('@/components/ReCaptcha', () => {
  return function MockReCaptcha({ onVerify, onExpired, className }: { 
    onVerify: (token: string | null) => void, 
    onExpired?: () => void,
    className?: string 
  }) {
    return (
      <div data-testid="recaptcha-mock" className={className}>
        <button 
          type="button" 
          onClick={() => onVerify('mock-recaptcha-token')}
          data-testid="verify-recaptcha-button"
        >
          Verify reCAPTCHA
        </button>
        {onExpired && (
          <button 
            type="button" 
            onClick={onExpired}
            data-testid="expire-recaptcha-button"
          >
            Expire reCAPTCHA
          </button>
        )}
      </div>
    );
  };
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ContactForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });
  
  it('renders the contact form correctly', () => {
    render(<ContactForm />);
    
    // Check if all form fields are rendered
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
    
    // Check if reCAPTCHA is rendered
    expect(screen.getByTestId('recaptcha-mock')).toBeInTheDocument();
    
    // Check if submit button is rendered
    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });
  
  it('validates form fields on submission', async () => {
    // Mock API response with validation errors
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        errors: [
          { field: 'name', message: 'Name is required' },
          { field: 'email', message: 'Email is required' },
          { field: 'subject', message: 'Subject is required' },
          { field: 'message', message: 'Message is required' }
        ]
      })
    });
    
    const user = userEvent.setup();
    render(<ContactForm />);
    
    // Verify reCAPTCHA first to bypass that validation
    await user.click(screen.getByTestId('verify-recaptcha-button'));
    
    // Submit empty form
    await user.click(screen.getByRole('button', { name: /Send Message/i }));
    
    // Check if validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Subject is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Message is required/i)).toBeInTheDocument();
    });
  });
  
  it('validates reCAPTCHA on submission', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    
    // Fill in all required fields
    await user.type(screen.getByLabelText(/Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/Subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/Message/i), 'This is a test message.');
    
    // Submit without verifying reCAPTCHA
    await user.click(screen.getByRole('button', { name: /Send Message/i }));
    
    // Check if reCAPTCHA error is displayed
    await waitFor(() => {
      expect(screen.getByText(/Please complete the reCAPTCHA verification/i)).toBeInTheDocument();
    });
  });
  
  it('submits the form successfully', async () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Message sent successfully' }),
    });
    
    const user = userEvent.setup();
    render(<ContactForm />);
    
    // Fill in all required fields
    await user.type(screen.getByLabelText(/Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/Subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/Message/i), 'This is a test message.');
    
    // Verify reCAPTCHA
    await user.click(screen.getByTestId('verify-recaptcha-button'));
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /Send Message/i }));
    
    // Check if form submission was initiated
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'This is a test message.',
          recaptchaToken: 'mock-recaptcha-token'
        }),
      });
    });
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/Thank you for your message/i)).toBeInTheDocument();
    });
    
    // Form should be reset
    expect(screen.getByLabelText(/Name/i)).toHaveValue('');
    expect(screen.getByLabelText(/Email/i)).toHaveValue('');
    expect(screen.getByLabelText(/Subject/i)).toHaveValue('');
    expect(screen.getByLabelText(/Message/i)).toHaveValue('');
  });
  
  it('handles API errors gracefully', async () => {
    // Mock error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ 
        success: false, 
        error: 'Failed to send message. Please try again.' 
      }),
    });
    
    const user = userEvent.setup();
    render(<ContactForm />);
    
    // Fill in all required fields
    await user.type(screen.getByLabelText(/Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/Subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/Message/i), 'This is a test message.');
    
    // Verify reCAPTCHA
    await user.click(screen.getByTestId('verify-recaptcha-button'));
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /Send Message/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to send message. Please try again./i)).toBeInTheDocument();
    });
  });
  
  it('handles network errors gracefully', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    const user = userEvent.setup();
    render(<ContactForm />);
    
    // Fill in all required fields
    await user.type(screen.getByLabelText(/Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/Subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/Message/i), 'This is a test message.');
    
    // Verify reCAPTCHA
    await user.click(screen.getByTestId('verify-recaptcha-button'));
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /Send Message/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });
  });
  
  it('handles reCAPTCHA expiration', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    
    // Verify reCAPTCHA
    await user.click(screen.getByTestId('verify-recaptcha-button'));
    
    // Then expire it
    await user.click(screen.getByTestId('expire-recaptcha-button'));
    
    // Fill form and submit
    await user.type(screen.getByLabelText(/Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/Subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/Message/i), 'This is a test message.');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /Send Message/i }));
    
    // Check if reCAPTCHA error is displayed
    await waitFor(() => {
      expect(screen.getByText(/Please complete the reCAPTCHA verification/i)).toBeInTheDocument();
    });
  });
  
  it('focuses on the first field with error after validation', async () => {
    // Mock API response with validation errors
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        errors: [
          { field: 'name', message: 'Name is required' }
        ]
      })
    });
    
    const user = userEvent.setup();
    
    // Mock focus method
    const mockFocus = jest.fn();
    jest.spyOn(HTMLInputElement.prototype, 'focus').mockImplementation(mockFocus);
    
    render(<ContactForm />);
    
    // Verify reCAPTCHA first to bypass that validation
    await user.click(screen.getByTestId('verify-recaptcha-button'));
    
    // Submit empty form
    await user.click(screen.getByRole('button', { name: /Send Message/i }));
    
    // Wait for validation
    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
    
    // Check if focus was called on the name input
    expect(mockFocus).toHaveBeenCalled();
    
    // Clean up
    (HTMLInputElement.prototype.focus as jest.Mock).mockRestore();
  });
});
