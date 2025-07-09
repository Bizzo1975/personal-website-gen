import { query } from '@/lib/db';

export interface ProfileData {
  id?: string;
  name: string;
  imageUrl: string;
  skills: string[];
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
        return null;
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
      
      return {
        id: profile.id,
        name: profile.name || '',
        imageUrl: profile.image_url || '/images/placeholder-image.png',
        skills: skills,
        location: profile.location || '',
        email: profile.email || '',
        socialLinks: {
          github: socialLinks.github || '',
          linkedin: socialLinks.linkedin || '',
          website: socialLinks.website || ''
        }
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
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
            location = $4, 
            email = $5, 
            social_links = $6,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $7`,
          [
            data.name,
            data.imageUrl,
            data.skills || [],
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
            name, image_url, skills, location, email, social_links, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            data.name,
            data.imageUrl,
            data.skills || [],
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