import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// GET - Fetch filter options for subscriber management
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    const userResult = await query(
      'SELECT role FROM users WHERE email = $1',
      [session.user.email]
    );

    if (!userResult.rows[0] || userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all unique subscription sources
    const sourcesResult = await query(`
      SELECT DISTINCT subscription_source
      FROM newsletter_subscribers
      WHERE subscription_source IS NOT NULL
      ORDER BY subscription_source
    `);

    const sources = sourcesResult.rows.map(row => row.subscription_source);

    // Get all unique interests
    const interestsResult = await query(`
      SELECT DISTINCT unnest(interests) as interest
      FROM newsletter_subscribers
      WHERE interests IS NOT NULL AND array_length(interests, 1) > 0
      ORDER BY interest
    `);

    const interests = interestsResult.rows.map(row => row.interest);

    // Get all unique locations (countries)
    const locationsResult = await query(`
      SELECT DISTINCT metadata->>'location'->>'country' as country
      FROM newsletter_subscribers
      WHERE metadata->>'location'->>'country' IS NOT NULL
      ORDER BY country
    `);

    const locations = locationsResult.rows
      .map(row => row.country)
      .filter(country => country !== null);

    // Get all unique companies
    const companiesResult = await query(`
      SELECT DISTINCT company
      FROM newsletter_subscribers
      WHERE company IS NOT NULL AND company != ''
      ORDER BY company
    `);

    const companies = companiesResult.rows.map(row => row.company);

    // Get preference frequencies
    const frequenciesResult = await query(`
      SELECT DISTINCT preferences->>'frequency' as frequency
      FROM newsletter_subscribers
      WHERE preferences->>'frequency' IS NOT NULL
      ORDER BY frequency
    `);

    const frequencies = frequenciesResult.rows
      .map(row => row.frequency)
      .filter(freq => freq !== null);

    return NextResponse.json({
      sources,
      interests,
      locations,
      companies,
      frequencies
    });

  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
} 