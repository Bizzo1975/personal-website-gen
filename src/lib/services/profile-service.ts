import { query } from '@/lib/db';

export interface ProfileData {
  id?: string;
  name: string;
  imageUrl: string;
  skills: string[];
  homePageSkills?: string[]; // Skills to display on home page Professional Skills card
  location?: string;
  email?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    website?: string;
  };
}

export const profileService = {
  async getProfile(): Promise<ProfileData | null> {
    try {
      const result = await query('SELECT * FROM profiles LIMIT 1');

      if (result.rows.length === 0) {
        console.log('No profile found in database');
        return null;
      }

      const profile = result.rows[0];
      console.log('Raw profile data from database:', profile);
      
      // Parse social_links JSONB field
      let socialLinks: { github?: string; linkedin?: string; website?: string } = {};
      try {
        if (profile.social_links) {
          if (typeof profile.social_links === 'string') {
            socialLinks = JSON.parse(profile.social_links);
          } else {
            socialLinks = profile.social_links;
          }
        }
      } catch (e) {
        console.error('Error parsing social_links:', e);
        socialLinks = {};
      }
      
      // Parse skills array
      let skills = [];
      try {
        if (profile.skills) {
          if (Array.isArray(profile.skills)) {
            skills = profile.skills;
          } else if (typeof profile.skills === 'string') {
            skills = JSON.parse(profile.skills);
          }
        }
      } catch (e) {
        console.error('Error parsing skills:', e);
        skills = [];
      }
      
      // Parse home page skills array
      let homePageSkills = [];
      try {
        if (profile.home_page_skills) {
          if (Array.isArray(profile.home_page_skills)) {
            homePageSkills = profile.home_page_skills;
          } else if (typeof profile.home_page_skills === 'string') {
            homePageSkills = JSON.parse(profile.home_page_skills);
          }
        }
      } catch (e) {
        console.error('Error parsing home_page_skills:', e);
        homePageSkills = [];
      }
      
      const profileData = {
        id: profile.id,
        name: profile.name || 'Developer',
        imageUrl: profile.image_url || '/images/placeholder-image.png',
        skills: skills,
        homePageSkills: homePageSkills,
        location: profile.location || '',
        email: profile.email || '',
        socialLinks: {
          github: socialLinks.github || '',
          linkedin: socialLinks.linkedin || '',
          website: socialLinks.website || ''
        }
      };
      
      console.log('Processed profile data:', profileData);
      return profileData;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  async updateProfile(data: ProfileData): Promise<ProfileData> {
    try {
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
      
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async uploadProfileImage(file: File): Promise<string> {
    // This would integrate with your actual file upload service
    console.log('Uploading profile image:', file);
    // For now, return a placeholder until you have actual file upload configured
    return '/images/profile-updated.jpg';
  }
};

export async function getProfileData(): Promise<ProfileData | null> {
  return profileService.getProfile();
}

export async function createProfile(profileData: Partial<ProfileData>): Promise<ProfileData> {
  return profileService.updateProfile(profileData as ProfileData);
}

export async function updateProfile(profileData: Partial<ProfileData>): Promise<ProfileData> {
  return profileService.updateProfile(profileData as ProfileData);
} 