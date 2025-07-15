import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Fetch the actual profile data from database - no authentication required
    const result = await query(
      'SELECT name, image_url, skills, home_page_skills, location, social_links FROM profiles LIMIT 1'
    );

    if (result.rows.length === 0) {
      // Return default profile structure if no profile exists
      const defaultProfile = {
        name: 'Developer',
        imageUrl: '/images/placeholder-image.png',
        skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'TailwindCSS', 'Python', 'Docker', 'AWS', 'PostgreSQL', 'MongoDB', 'GraphQL', 'Redis'],
        homePageSkills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'TailwindCSS', 'Python'],
        location: '',
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
      name: profile.name || 'Developer',
      imageUrl: profile.image_url || '/images/placeholder-image.png',
      skills: skills,
      homePageSkills: homePageSkills,
      location: profile.location || '',
      socialLinks: {
        github: (socialLinks as any)?.github || '',
        linkedin: (socialLinks as any)?.linkedin || '',
        website: (socialLinks as any)?.website || ''
      }
    };

    return NextResponse.json(formattedProfile);
  } catch (error) {
    console.error('Public profile fetch error:', error);
    
    // Return default profile data if database query fails
    const defaultProfile = {
      name: 'Developer',
      imageUrl: '/images/placeholder-image.png',
      skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'TailwindCSS', 'Python', 'Docker', 'AWS', 'PostgreSQL', 'MongoDB', 'GraphQL', 'Redis'],
      homePageSkills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'TailwindCSS', 'Python'],
      location: '',
      socialLinks: {
        github: '',
        linkedin: '',
        website: ''
      }
    };
    return NextResponse.json(defaultProfile);
  }
} 