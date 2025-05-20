import dbConnect, { isMockMode } from '@/lib/db';
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

// Mock data storage key for Node.js global object
const MOCK_PROFILE_KEY = 'mockProfileData';

// Helper function to determine if we should use mock data
const useMockData = () => {
  return isMockMode();
};

// Function to get mock profile from global store
const getMockProfileFromGlobal = (): ProfileData => {
  // Check if we have already stored mock profile in the global object
  if ((global as any)[MOCK_PROFILE_KEY]) {
    return (global as any)[MOCK_PROFILE_KEY];
  }
  return defaultProfile;
};

export async function getProfileData(): Promise<ProfileData> {
  try {
    // For development without MongoDB, try to get from the global store first
    if (useMockData()) {
      console.log('📖 Getting profile data from global store');
      return getMockProfileFromGlobal();
    }
    
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