import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../setup';
import { useRouter } from 'next/navigation';
import SiteSettingsPage from '@/app/admin/settings/site/page';

// Mock the modules
jest.mock('next/navigation');
jest.mock('@/app/admin/components/AdminLayout', () => {
  return function MockAdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
    return (
      <div data-testid="admin-layout">
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

jest.mock('@/app/admin/components/AdminPageLayout', () => {
  return function MockAdminPageLayout({ children, title }: { children: React.ReactNode; title: string }) {
    return (
      <div data-testid="admin-page-layout">
        <h2>{title}</h2>
        {children}
      </div>
    );
  };
});

jest.mock('@/app/admin/components/AdminFormLayout', () => {
  return function MockAdminFormLayout({ children, onSubmit }: { children: React.ReactNode; onSubmit: (e: React.FormEvent) => void }) {
    return (
      <form data-testid="admin-form-layout" onSubmit={onSubmit}>
        {children}
      </form>
    );
  };
});

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

// Mock the site settings service
jest.mock('@/lib/services/site-settings-service', () => ({
  getSiteSettings: jest.fn(),
  updateSiteSettings: jest.fn(),
  uploadLogo: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('SiteSettingsPage', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    // Mock successful getSiteSettings response
    const { getSiteSettings } = require('@/lib/services/site-settings-service');
    getSiteSettings.mockResolvedValue({
      logoUrl: '/images/wizard-icon.svg',
      logoText: 'John Doe',
      footerText: 'Built with Next.js and Tailwind CSS',
      bioText: 'Full-stack developer specializing in modern web technologies.',
      navbarStyle: 'default',
      navbarLinks: []
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders site settings form with all fields', async () => {
    render(<SiteSettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Logo Text')).toBeInTheDocument();
      expect(screen.getByLabelText('Footer Text')).toBeInTheDocument();
      expect(screen.getByLabelText('Bio Text')).toBeInTheDocument();
    });
  });

  it('loads existing settings on mount', async () => {
    const { getSiteSettings } = require('@/lib/services/site-settings-service');
    
    render(<SiteSettingsPage />);

    await waitFor(() => {
      expect(getSiteSettings).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Built with Next.js and Tailwind CSS')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Full-stack developer specializing in modern web technologies.')).toBeInTheDocument();
    });
  });

  it('updates form fields when user types', async () => {
    const user = userEvent.setup();
    
    render(<SiteSettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Logo Text')).toBeInTheDocument();
    });

    const logoTextInput = screen.getByLabelText('Logo Text');
    await user.clear(logoTextInput);
    await user.type(logoTextInput, 'New Logo Text');

    expect(logoTextInput).toHaveValue('New Logo Text');
  });

  it('submits form with updated settings', async () => {
    const user = userEvent.setup();
    const { updateSiteSettings } = require('@/lib/services/site-settings-service');
    updateSiteSettings.mockResolvedValue({});

    render(<SiteSettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Logo Text')).toBeInTheDocument();
    });

    // Update some fields
    const logoTextInput = screen.getByLabelText('Logo Text');
    await user.clear(logoTextInput);
    await user.type(logoTextInput, 'Updated Logo');

    const footerTextInput = screen.getByLabelText('Footer Text');
    await user.clear(footerTextInput);
    await user.type(footerTextInput, 'Updated footer text');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save settings/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(updateSiteSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          logoText: 'Updated Logo',
          footerText: 'Updated footer text'
        })
      );
    });
  });

  it('displays success message after successful save', async () => {
    const user = userEvent.setup();
    const { updateSiteSettings } = require('@/lib/services/site-settings-service');
    updateSiteSettings.mockResolvedValue({});

    render(<SiteSettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Logo Text')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /save settings/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Site settings updated successfully!')).toBeInTheDocument();
    });
  });

  it('displays error message on save failure', async () => {
    const user = userEvent.setup();
    const { updateSiteSettings } = require('@/lib/services/site-settings-service');
    updateSiteSettings.mockRejectedValue(new Error('Update failed'));

    render(<SiteSettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Logo Text')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /save settings/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save settings. Please try again.')).toBeInTheDocument();
    });
  });

  it('handles loading state correctly', async () => {
    const { getSiteSettings } = require('@/lib/services/site-settings-service');
    
    // Create a promise that won't resolve immediately
    let resolvePromise: (value: any) => void;
    const loadingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    getSiteSettings.mockReturnValue(loadingPromise);

    render(<SiteSettingsPage />);

    // Should show loading state
    expect(screen.queryByLabelText('Logo Text')).not.toBeInTheDocument();

    // Resolve the promise
    resolvePromise!({
      logoUrl: '/images/wizard-icon.svg',
      logoText: 'John Doe',
      footerText: 'Built with Next.js and Tailwind CSS',
      bioText: 'Full-stack developer specializing in modern web technologies.',
      navbarStyle: 'default',
      navbarLinks: []
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Logo Text')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(<SiteSettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Logo Text')).toBeInTheDocument();
    });

    const logoTextInput = screen.getByLabelText('Logo Text');
    const bioTextInput = screen.getByLabelText('Bio Text');
    
    // Required fields should have required attribute
    expect(logoTextInput).toBeRequired();
    expect(bioTextInput).toBeRequired();
  });
}); 