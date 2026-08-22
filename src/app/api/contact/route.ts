import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  graphConfigured,
  graphBrandFrom,
  graphSendMail,
  graphSendContactConfirmation,
} from '@/lib/services/graph-mail';

// --- Anti-spam layer hardened 2026-08-22 (fail-closed honeypot/timing + IP/subnet rate limit) ---
// This form posts FormData (supports file attachments), so honeypot/timing
// travel as extra form fields ("website", "form_rendered_at"). Both are now
// required (fail-closed) since the live frontend always sends them — a
// request missing either is not a real submission from this page.

function getClientIp(request: NextRequest): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((p) => p.trim());
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return 'unknown';
}

function getClientSubnet(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  }
  return ip;
}

type Hit = number[];
const rateBuckets = new Map<string, Hit>();

function rateCheck(key: string, perHourMax: number, perDayMax: number): boolean {
  const now = Date.now();
  const hits = (rateBuckets.get(key) || []).filter((t) => now - t < 86_400_000);
  const last = hits[hits.length - 1];
  const tooSoon = last !== undefined && now - last < 20_000;
  const inLastHour = hits.filter((t) => now - t < 3_600_000).length;
  if (tooSoon || inLastHour >= perHourMax || hits.length >= perDayMax) {
    return false;
  }
  hits.push(now);
  rateBuckets.set(key, hits);
  return true;
}
// --- end anti-spam helpers ---

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const subnet = getClientSubnet(ip);

    const formData = await request.formData();

    // 1) Honeypot + timing — fail closed on missing fields.
    const websiteRaw = formData.get('website');
    const renderedAtRaw = formData.get('form_rendered_at') as string | null;

    if (websiteRaw === null || renderedAtRaw === null) {
      console.warn('[contact][blocked:missing-fields] ip=', ip);
      return NextResponse.json({ success: true, message: 'Message sent successfully!' });
    }

    const honeypot = (websiteRaw as string)?.trim() || '';
    if (honeypot) {
      console.warn('🕸️ [contact][blocked:honeypot] ip=', ip);
      return NextResponse.json({ success: true, message: 'Message sent successfully!' });
    }

    const renderedAt = Number(renderedAtRaw);
    if (!Number.isFinite(renderedAt)) {
      console.warn('[contact][blocked:timing-invalid] ip=', ip);
      return NextResponse.json({ success: true, message: 'Message sent successfully!' });
    }
    const elapsedMs = Date.now() - renderedAt;
    if (elapsedMs < 0 || elapsedMs < 3000) {
      console.warn('⏱️ [contact][blocked:timing] ip=', ip, 'elapsedMs:', elapsedMs);
      return NextResponse.json({ success: true, message: 'Message sent successfully!' });
    }

    // 2) Rate limiting — per-IP and per-/24-subnet sliding window.
    if (!rateCheck(ip, 8, 20)) {
      console.warn('[contact][blocked:ratelimit-ip] ip=', ip);
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment before submitting again.' },
        { status: 429 }
      );
    }
    if (!rateCheck(subnet, 15, 40)) {
      console.warn('[contact][blocked:ratelimit-subnet] ip=', ip, 'subnet=', subnet);
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment before submitting again.' },
        { status: 429 }
      );
    }
    // --- end anti-spam layer ---

    const contactData = {
      name: (formData.get('name') as string)?.trim() || '',
      email: (formData.get('email') as string)?.trim() || '',
      subject: (formData.get('subject') as string)?.trim() || '',
      message: (formData.get('message') as string)?.trim() || '',
      category: (formData.get('category') as string)?.trim() || '',
      company: (formData.get('company') as string)?.trim() || '',
      phone: (formData.get('phone') as string)?.trim() || '',
      timeline: (formData.get('timeline') as string)?.trim() || '',
      budget: (formData.get('budget') as string)?.trim() || '',
      newsletter: formData.get('newsletter') === 'true',
      terms: formData.get('terms') === 'true',
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || '',
    };

    if (!contactData.name || !contactData.email || !contactData.subject || !contactData.message) {
      const missingFields = [];
      if (!contactData.name) missingFields.push('name');
      if (!contactData.email) missingFields.push('email');
      if (!contactData.subject) missingFields.push('subject');
      if (!contactData.message) missingFields.push('message');
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}. Please fill in all required fields.`
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address format.' },
        { status: 400 }
      );
    }

    const validCategories = ['general', 'project', 'collaboration'];
    if (contactData.category && !validCategories.includes(contactData.category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category: ${contactData.category}. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }
    if (!contactData.category) {
      contactData.category = 'general';
    }

    const attachmentFiles: string[] = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'contact');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }

    const attachmentKeys = Array.from(formData.keys()).filter(key => key.startsWith('attachment_'));
    for (const key of attachmentKeys) {
      const file = formData.get(key) as File;
      if (file && file.size > 0) {
        try {
          const fileName = `${uuidv4()}_${file.name}`;
          const filePath = path.join(uploadDir, fileName);
          const arrayBuffer = await file.arrayBuffer();
          await writeFile(filePath, Buffer.from(arrayBuffer));
          attachmentFiles.push(fileName);
        } catch (error) {
          console.error('Error saving attachment:', error);
        }
      }
    }

    if (!graphConfigured()) {
      console.error('Graph mail not configured');
      return NextResponse.json(
        { success: false, error: 'Email service not configured. Please try again later or email hello@willworkforlunch.com.' },
        { status: 500 }
      );
    }

    const brandFrom = graphBrandFrom();
    const staffBody = [
      'New contact form submission from willworkforlunch.com',
      '',
      `Name: ${contactData.name}`,
      `Email: ${contactData.email}`,
      `Category: ${contactData.category}`,
      `Subject: ${contactData.subject}`,
      contactData.company ? `Company: ${contactData.company}` : '',
      contactData.phone ? `Phone: ${contactData.phone}` : '',
      contactData.timeline ? `Timeline: ${contactData.timeline}` : '',
      contactData.budget ? `Budget: ${contactData.budget}` : '',
      attachmentFiles.length ? `Attachments: ${attachmentFiles.join(', ')}` : '',
      '',
      'Message:',
      contactData.message,
      '',
    ].filter(Boolean).join('\n');

    const staffOk = await graphSendMail({
      to: brandFrom,
      from: brandFrom,
      replyTo: contactData.email,
      subject: `[${contactData.category}] ${contactData.subject}`,
      body: staffBody,
    });

    if (!staffOk) {
      return NextResponse.json(
        { success: false, error: 'Mail delivery failed. Please email hello@willworkforlunch.com.' },
        { status: 500 }
      );
    }

    try {
      await graphSendContactConfirmation(contactData.email, contactData.name, 'willworkforlunch');
    } catch (error) {
      console.error('Error sending confirmation:', error);
    }

    if (contactData.newsletter) {
      try {
        const newsletterResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/newsletter/subscribers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: contactData.email,
            name: contactData.name,
            phone: contactData.phone || null,
            company: contactData.company || null,
            source: 'contact_form',
            metadata: {
              contactCategory: contactData.category,
              contactSubject: contactData.subject,
              submittedAt: new Date().toISOString(),
              ipAddress: ip,
              userAgent: contactData.userAgent
            }
          })
        });
        const newsletterResult = await newsletterResponse.json();
        if (!newsletterResult.success) {
          console.error('Newsletter subscription failed:', newsletterResult.error);
        }
      } catch (error) {
        console.error('Error subscribing to newsletter:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully!' + (contactData.newsletter ? ' You have also been subscribed to our newsletter.' : '')
    });

  } catch (error) {
    console.error('❌ Contact form error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage || 'An error occurred while processing your request. Please try again later.'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://willworkforlunch.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
