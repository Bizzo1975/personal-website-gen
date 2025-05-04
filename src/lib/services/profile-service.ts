import dbConnect from '@/lib/db';
import Profile from '@/lib/models/Profile';

export interface ProfileData {
  name: string;
  imageUrl: string;
  skills: string[];
  bio?: string;
  location?: string;
  email?: string;
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

// Default profile data to use as fallback
const defaultProfile: ProfileData = {
  name: 'John Doe',
  imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  skills: [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js',
    'Express', 'MongoDB', 'PostgreSQL', 'HTML5', 'CSS3',
    'Tailwind CSS', 'Git', 'Docker', 'AWS'
  ],
  location: 'New York, USA',
  email: 'john@example.com',
  socialLinks: {
    github: 'https://github.com',
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com'
  }
};

export async function getProfileData(): Promise<ProfileData> {
  try {
    await dbConnect();
    
    // Try to get the profile from the database
    const profile = await Profile.findOne({});
    
    if (!profile) {
      return defaultProfile;
    }
    
    return {
      name: profile.name,
      imageUrl: profile.imageUrl,
      skills: profile.skills,
      bio: profile.bio,
      location: profile.location,
      email: profile.email,
      socialLinks: profile.socialLinks
    };
  } catch (error) {
    console.error('Error fetching profile data:', error);
    return defaultProfile;
  }
} 