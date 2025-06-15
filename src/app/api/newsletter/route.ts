import { NextRequest, NextResponse } from 'next/server';

interface SubscriptionData {
  email: string;
  firstName?: string;
  interests?: string[];
  source: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  firstName?: string;
  interests: string[];
  source: string;
  status: 'active' | 'pending' | 'unsubscribed' | 'bounced';
  subscribedAt: Date;
  confirmedAt?: Date;
  lastEmailSent?: Date;
  openRate: number;
  clickRate: number;
  tags: string[];
}

// POST - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, interests, source } = body;

    // Validation
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check for disposable email domains (basic list)
    const disposableEmailDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com'
    ];
    
    const emailDomain = email.split('@')[1].toLowerCase();
    if (disposableEmailDomains.includes(emailDomain)) {
      return NextResponse.json(
        { error: 'Please use a permanent email address' },
        { status: 400 }
      );
    }

    // Get client info for analytics
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const subscriptionData: SubscriptionData = {
      email: email.toLowerCase().trim(),
      firstName: firstName?.trim() || undefined,
      interests: interests || [],
      source: source || 'website',
      timestamp: new Date(),
      ipAddress: clientIP,
      userAgent
    };

    // Check if already subscribed
    const existingSubscriber = await checkExistingSubscriber(subscriptionData.email);
    
    if (existingSubscriber) {
      if (existingSubscriber.status === 'active') {
        return NextResponse.json(
          { error: 'This email is already subscribed to our newsletter' },
          { status: 409 }
        );
      } else if (existingSubscriber.status === 'unsubscribed') {
        // Resubscribe
        await resubscribeUser(subscriptionData);
        return NextResponse.json({
          message: 'Welcome back! Your subscription has been reactivated.',
          success: true,
          action: 'resubscribed'
        });
      }
    }

    // Create new subscription
    const newSubscriber = await createSubscriber(subscriptionData);

    // Send confirmation email (in real app)
    await sendConfirmationEmail(newSubscriber);

    // Track subscription event
    await trackSubscriptionEvent(subscriptionData);

    // Integration with email service (placeholder)
    await integrateWithEmailService(newSubscriber);

    return NextResponse.json({
      message: 'Thank you for subscribing! Please check your email to confirm your subscription.',
      success: true,
      subscriber: {
        id: newSubscriber.id,
        email: newSubscriber.email,
        status: newSubscriber.status
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    // Check for specific errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many subscription attempts. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('email service')) {
        return NextResponse.json(
          { error: 'Newsletter service temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process subscription. Please try again.' },
      { status: 500 }
    );
  }
}

// GET - Get subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email && !token) {
      return NextResponse.json(
        { error: 'Email or token is required' },
        { status: 400 }
      );
    }

    let subscriber;
    if (token) {
      subscriber = await getSubscriberByToken(token);
    } else if (email) {
      subscriber = await checkExistingSubscriber(email);
    } else {
      return NextResponse.json(
        { error: 'Email or token is required' },
        { status: 400 }
      );
    }

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        firstName: subscriber.firstName,
        status: subscriber.status,
        interests: subscriber.interests,
        subscribedAt: subscriber.subscribedAt,
        stats: {
          openRate: subscriber.openRate,
          clickRate: subscriber.clickRate
        }
      },
      success: true
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}

// PUT - Update subscription preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, firstName, interests, status } = body;

    if (!email && !token) {
      return NextResponse.json(
        { error: 'Email or token is required' },
        { status: 400 }
      );
    }

    let subscriber;
    if (token) {
      subscriber = await getSubscriberByToken(token);
    } else {
      subscriber = await checkExistingSubscriber(email);
    }

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      );
    }

    // Update subscriber preferences
    const updatedSubscriber = await updateSubscriber(subscriber.id, {
      firstName,
      interests,
      status
    });

    // Sync with email service
    await syncWithEmailService(updatedSubscriber);

    return NextResponse.json({
      message: 'Subscription preferences updated successfully',
      subscriber: {
        id: updatedSubscriber.id,
        email: updatedSubscriber.email,
        firstName: updatedSubscriber.firstName,
        interests: updatedSubscriber.interests,
        status: updatedSubscriber.status
      },
      success: true
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    const reason = searchParams.get('reason');

    if (!email && !token) {
      return NextResponse.json(
        { error: 'Email or token is required' },
        { status: 400 }
      );
    }

    let subscriber;
    if (token) {
      subscriber = await getSubscriberByToken(token);
    } else if (email) {
      subscriber = await checkExistingSubscriber(email);
    } else {
      return NextResponse.json(
        { error: 'Email or token is required' },
        { status: 400 }
      );
    }

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      );
    }

    // Unsubscribe user
    await unsubscribeUser(subscriber.id, reason);

    // Remove from email service
    await removeFromEmailService(subscriber.email);

    // Track unsubscribe event
    await trackUnsubscribeEvent(subscriber.email, reason);

    return NextResponse.json({
      message: 'You have been successfully unsubscribed from our newsletter',
      success: true
    });

  } catch (error) {
    console.error('Error unsubscribing:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}

// Helper functions (in a real app, these would interact with your database)

async function checkExistingSubscriber(email: string): Promise<NewsletterSubscriber | null> {
  // Mock implementation - in real app, query database
  console.log('Checking existing subscriber:', email);
  
  // Simulate some existing subscribers
  const mockSubscribers: { [key: string]: NewsletterSubscriber } = {
    'existing@example.com': {
      id: '1',
      email: 'existing@example.com',
      firstName: 'Existing User',
      interests: ['Web Development'],
      source: 'website',
      status: 'active',
      subscribedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      openRate: 0.75,
      clickRate: 0.25,
      tags: ['engaged']
    }
  };

  return mockSubscribers[email] || null;
}

async function createSubscriber(data: SubscriptionData): Promise<NewsletterSubscriber> {
  const newSubscriber: NewsletterSubscriber = {
    id: Date.now().toString(),
    email: data.email,
    firstName: data.firstName,
    interests: data.interests || [],
    source: data.source,
    status: 'pending', // Requires email confirmation
    subscribedAt: data.timestamp,
    openRate: 0,
    clickRate: 0,
    tags: []
  };

  // In real app, save to database
  console.log('Creating subscriber:', newSubscriber);
  
  return newSubscriber;
}

async function resubscribeUser(data: SubscriptionData): Promise<void> {
  console.log('Resubscribing user:', data.email);
  // In real app, update database status to 'active'
}

async function updateSubscriber(id: string, updates: Partial<NewsletterSubscriber>): Promise<NewsletterSubscriber> {
  console.log('Updating subscriber:', id, updates);
  // In real app, update database record
  
  // Mock return
  return {
    id,
    email: 'updated@example.com',
    firstName: updates.firstName,
    interests: updates.interests || [],
    source: 'website',
    status: updates.status || 'active',
    subscribedAt: new Date(),
    openRate: 0.5,
    clickRate: 0.15,
    tags: []
  };
}

async function unsubscribeUser(id: string, reason?: string | null): Promise<void> {
  console.log('Unsubscribing user:', id, 'Reason:', reason);
  // In real app, update database status to 'unsubscribed'
}

async function getSubscriberByToken(token: string): Promise<NewsletterSubscriber | null> {
  console.log('Getting subscriber by token:', token);
  // In real app, decode token and fetch subscriber
  return null;
}

async function sendConfirmationEmail(subscriber: NewsletterSubscriber): Promise<void> {
  console.log('Sending confirmation email to:', subscriber.email);
  // In real app, send email using your email service
  
  // Mock email template data
  const confirmationData = {
    email: subscriber.email,
    firstName: subscriber.firstName || 'Friend',
    confirmationUrl: `${process.env.NEXTAUTH_URL}/newsletter/confirm?token=${generateConfirmationToken(subscriber.id)}`,
    unsubscribeUrl: `${process.env.NEXTAUTH_URL}/newsletter/unsubscribe?token=${generateUnsubscribeToken(subscriber.id)}`
  };

  console.log('Confirmation email data:', confirmationData);
}

async function integrateWithEmailService(subscriber: NewsletterSubscriber): Promise<void> {
  console.log('Integrating with email service:', subscriber.email);
  
  // Mock integration with popular email services
  const emailServiceConfig = {
    service: process.env.EMAIL_SERVICE || 'mailchimp', // mailchimp, convertkit, sendgrid, etc.
    apiKey: process.env.EMAIL_SERVICE_API_KEY,
    listId: process.env.EMAIL_SERVICE_LIST_ID
  };

  // In real app, make API call to email service
  console.log('Email service integration:', emailServiceConfig);
}

async function syncWithEmailService(subscriber: NewsletterSubscriber): Promise<void> {
  console.log('Syncing with email service:', subscriber.email);
  // In real app, update subscriber in email service
}

async function removeFromEmailService(email: string): Promise<void> {
  console.log('Removing from email service:', email);
  // In real app, remove/unsubscribe from email service
}

async function trackSubscriptionEvent(data: SubscriptionData): Promise<void> {
  console.log('Tracking subscription event:', data.source);
  
  // Mock analytics tracking
  const eventData = {
    event: 'newsletter_subscription',
    properties: {
      email: data.email,
      source: data.source,
      interests: data.interests,
      timestamp: data.timestamp,
      user_agent: data.userAgent,
      ip_address: data.ipAddress
    }
  };

  console.log('Analytics event:', eventData);
}

async function trackUnsubscribeEvent(email: string, reason?: string | null): Promise<void> {
  console.log('Tracking unsubscribe event:', email, reason);
  
  // Mock analytics tracking
  const eventData = {
    event: 'newsletter_unsubscribe',
    properties: {
      email,
      reason: reason || 'not_specified',
      timestamp: new Date()
    }
  };

  console.log('Unsubscribe event:', eventData);
}

function generateConfirmationToken(subscriberId: string): string {
  // In real app, generate secure token
  return Buffer.from(`confirm:${subscriberId}:${Date.now()}`).toString('base64');
}

function generateUnsubscribeToken(subscriberId: string): string {
  // In real app, generate secure token
  return Buffer.from(`unsubscribe:${subscriberId}:${Date.now()}`).toString('base64');
} 
