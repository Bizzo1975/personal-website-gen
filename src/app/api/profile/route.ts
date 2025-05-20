import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Profile from '@/lib/models/Profile';
import { ProfileData } from '@/lib/services/profile-service';

// Default profile data to use when creating a new profile
const defaultProfile: Omit<ProfileData, 'id'> = {
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
  return !process.env.MONGODB_URI || process.env.NODE_ENV === 'development';
};

// Function to initialize mock data (if it hasn't been initialized yet)
const initMockProfile = () => {
  // Check if we have already stored mock profile in the global object
  if (!(global as any)[MOCK_PROFILE_KEY]) {
    console.log('📋 Initializing mock profile data');
    (global as any)[MOCK_PROFILE_KEY] = { ...defaultProfile, id: 'mock-profile-id' };
  }
  return (global as any)[MOCK_PROFILE_KEY];
};

// Function to get mock profile (from global store)
const getMockProfile = () => {
  return initMockProfile();
};

// Function to save mock profile (to global store)
const saveMockProfile = (profile: any) => {
  console.log('💾 Saving mock profile data');
  (global as any)[MOCK_PROFILE_KEY] = profile;
  return profile;
};

export async function GET() {
  try {
    // For development without MongoDB
    if (useMockData()) {
      const mockProfile = getMockProfile();
      console.log('📖 Getting mock profile data');
      return NextResponse.json(mockProfile);
    }

    await dbConnect();
    let profile = await Profile.findOne({});
    
    // Create default profile if none exists
    if (!profile) {
      profile = await Profile.create(defaultProfile);
    }
    
    return NextResponse.json({
      id: profile._id.toString(),
      name: profile.name,
      imageUrl: profile.imageUrl,
      skills: profile.skills,
      bio: profile.bio,
      location: profile.location,
      email: profile.email,
      socialLinks: profile.socialLinks
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    // For development without MongoDB
    if (useMockData()) {
      const mockProfile = getMockProfile();
      const updatedProfile = { ...mockProfile, ...data };
      saveMockProfile(updatedProfile);
      console.log('✅ Mock profile updated successfully');
      return NextResponse.json(updatedProfile);
    }

    await dbConnect();
    
    // Find existing profile or create new one
    let profile = await Profile.findOne({});
    
    if (profile) {
      // Update existing profile
      profile = await Profile.findByIdAndUpdate(
        profile._id,
        { ...data, updatedAt: new Date() },
        { new: true }
      );
    } else {
      // Create new profile
      profile = await Profile.create({
        ...defaultProfile,
        ...data,
        updatedAt: new Date()
      });
    }
    
    return NextResponse.json({
      id: profile._id.toString(),
      name: profile.name,
      imageUrl: profile.imageUrl,
      skills: profile.skills,
      bio: profile.bio,
      location: profile.location,
      email: profile.email,
      socialLinks: profile.socialLinks
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile data' },
      { status: 500 }
    );
  }
} 