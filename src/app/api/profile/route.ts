import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the actual profile data from database
    const result = await query(
      'SELECT * FROM profiles LIMIT 1'
    );

    if (result.rows.length === 0) {
      // Return default profile structure if no profile exists
      const defaultProfile = {
        id: '1',
        name: session.user?.name || '',
        imageUrl: session.user?.image || '/images/placeholder-image.png',
        skills: [],
        homePageSkills: [],
        location: '',
        email: session.user?.email || '',
        socialLinks: {
          github: '',
          linkedin: '',
          website: ''
        }
      };
      return NextResponse.json(defaultProfile);
    }

    const profile = result.rows[0];
    
    // Parse social_links JSONB field
    let socialLinks = {};
    try {
      socialLinks = profile.social_links || {};
    } catch (e) {
      socialLinks = {};
    }
    
    // Parse skills array
    let skills = [];
    try {
      skills = profile.skills || [];
    } catch (e) {
      skills = [];
    }
    
    // Parse home page skills array
    let homePageSkills = [];
    try {
      homePageSkills = profile.home_page_skills || [];
    } catch (e) {
      homePageSkills = [];
    }
    
    // Format response to match frontend expectations
    const formattedProfile = {
      id: profile.id,
      name: profile.name || '',
      imageUrl: profile.image_url || '/images/placeholder-image.png',
      skills: skills,
      homePageSkills: homePageSkills,
      location: profile.location || '',
      email: profile.email || '',
      socialLinks: {
        github: (socialLinks as any)?.github || '',
        linkedin: (socialLinks as any)?.linkedin || '',
        website: (socialLinks as any)?.website || ''
      }
    };

    return NextResponse.json(formattedProfile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Prepare social_links JSONB
    const socialLinksJson = JSON.stringify({
      github: data.socialLinks?.github || '',
      linkedin: data.socialLinks?.linkedin || '',
      website: data.socialLinks?.website || ''
    });
    
    // Check if profile exists
    const existingProfile = await query('SELECT id FROM profiles LIMIT 1');
    
    if (existingProfile.rows.length > 0) {
      // Update existing profile
      await query(
        `UPDATE profiles SET 
          name = $1, 
          image_url = $2, 
          skills = $3, 
          home_page_skills = $4,
          location = $5, 
          email = $6, 
          social_links = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8`,
        [
          data.name,
          data.imageUrl,
          data.skills || [],
          JSON.stringify(data.homePageSkills || []),
          data.location || '',
          data.email || '',
          socialLinksJson,
          existingProfile.rows[0].id
        ]
      );
    } else {
      // Insert new profile
      await query(
        `INSERT INTO profiles (
          name, image_url, skills, home_page_skills, location, email, social_links, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          data.name,
          data.imageUrl,
          data.skills || [],
          JSON.stringify(data.homePageSkills || []),
          data.location || '',
          data.email || '',
          socialLinksJson
        ]
      );
    }
    
    // Return the updated profile data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
} 