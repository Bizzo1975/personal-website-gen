import { query } from '@/lib/db';

export interface SlideshowImage {
  id: string;
  filename: string;
  url: string;
  altText: string;
  order?: number;
}

export class SlideshowService {
  /**
   * Get all slideshow images from media library
   */
  static async getSlideshowImages(): Promise<SlideshowImage[]> {
    try {
      // Query media files that have 'slideshow' in their alt_text or filename
      const result = await query(
        `SELECT id, filename, file_path, alt_text 
         FROM media_files 
         WHERE (alt_text ILIKE '%slideshow%' OR filename ILIKE '%coding%')
         AND mime_type LIKE 'image/%'
         ORDER BY created_at ASC`,
        []
      );

      // Check if any of the database images have valid paths
      const validImages = result.rows.filter(row => {
        // Only accept images that are in the correct /images/slideshow/ directory
        return row.file_path && row.file_path.startsWith('/images/slideshow/');
      });

      // If we have valid images from database, use them
      if (validImages.length > 0) {
        return validImages.map((row, index) => ({
          id: row.id,
          filename: row.filename,
          url: row.file_path,
          altText: row.alt_text || `Slideshow image ${index + 1}`,
          order: index
        }));
      } else {
        // If no valid images in database, use fallback images
        console.log('No valid slideshow images in database, using fallback images');
        return this.getFallbackImages();
      }
    } catch (error) {
      console.error('Error fetching slideshow images:', error);
      // Return fallback images if database query fails
      return this.getFallbackImages();
    }
  }

  /**
   * Add an image to the slideshow by updating its metadata
   */
  static async addToSlideshow(mediaFileId: string): Promise<void> {
    try {
      await query(
        `UPDATE media_files 
         SET alt_text = COALESCE(alt_text, '') || ' slideshow'
         WHERE id = $1 AND alt_text NOT ILIKE '%slideshow%'`,
        [mediaFileId]
      );
    } catch (error) {
      console.error('Error adding image to slideshow:', error);
      throw error;
    }
  }

  /**
   * Remove an image from the slideshow
   */
  static async removeFromSlideshow(mediaFileId: string): Promise<void> {
    try {
      await query(
        `UPDATE media_files 
         SET alt_text = REPLACE(REPLACE(alt_text, ' slideshow', ''), 'slideshow', '')
         WHERE id = $1`,
        [mediaFileId]
      );
    } catch (error) {
      console.error('Error removing image from slideshow:', error);
      throw error;
    }
  }

  /**
   * Update slideshow image order
   */
  static async updateImageOrder(imageOrders: { id: string; order: number }[]): Promise<void> {
    try {
      // For now, we'll use the created_at timestamp to manage order
      // In a future enhancement, we could add an order column
      for (const item of imageOrders) {
        await query(
          `UPDATE media_files 
           SET updated_at = NOW() + INTERVAL '${item.order} minutes'
           WHERE id = $1`,
          [item.id]
        );
      }
    } catch (error) {
      console.error('Error updating image order:', error);
      throw error;
    }
  }

  /**
   * Get fallback slideshow images (for when database is not available)
   */
  static getFallbackImages(): SlideshowImage[] {
    return [
      {
        id: 'fallback-1',
        filename: 'coding-1.jpg',
        url: '/images/slideshow/coding-1.jpg',
        altText: 'Background slideshow image - coding workspace',
        order: 0
      },
      {
        id: 'fallback-2',
        filename: 'coding-2.jpg',
        url: '/images/slideshow/coding-2.jpg',
        altText: 'Background slideshow image - developer environment',
        order: 1
      },
      {
        id: 'fallback-3',
        filename: 'coding-3.jpg',
        url: '/images/slideshow/coding-3.jpg',
        altText: 'Background slideshow image - programming setup',
        order: 2
      },
      {
        id: 'fallback-4',
        filename: 'coding-4.jpg',
        url: '/images/slideshow/coding-4.jpg',
        altText: 'Background slideshow image - tech workspace',
        order: 3
      },
      {
        id: 'fallback-5',
        filename: 'coding-5.jpg',
        url: '/images/slideshow/coding-5.jpg',
        altText: 'Background slideshow image - development tools',
        order: 4
      }
    ];
  }

  /**
   * Get slideshow settings
   */
  static async getSlideshowSettings(): Promise<{
    interval: number;
    opacity: number;
    overlayOpacity: number;
    autoPlay: boolean;
  }> {
    try {
      const result = await query(
        `SELECT setting_key, setting_value 
         FROM site_settings 
         WHERE setting_key IN ('slideshowInterval', 'slideshowOpacity', 'slideshowOverlayOpacity', 'slideshowAutoPlay')`
      );

      const settings: any = {};
      result.rows.forEach(row => {
        try {
          settings[row.setting_key] = JSON.parse(row.setting_value);
        } catch {
          settings[row.setting_key] = row.setting_value;
        }
      });

      return {
        interval: settings.slideshowInterval || 7000,
        opacity: settings.slideshowOpacity || 0.15,
        overlayOpacity: settings.slideshowOverlayOpacity || 0.3,
        autoPlay: settings.slideshowAutoPlay !== false
      };
    } catch (error) {
      console.error('Error fetching slideshow settings:', error);
      return {
        interval: 7000,
        opacity: 0.15,
        overlayOpacity: 0.3,
        autoPlay: true
      };
    }
  }

  /**
   * Update slideshow settings
   */
  static async updateSlideshowSettings(settings: {
    interval?: number;
    opacity?: number;
    overlayOpacity?: number;
    autoPlay?: boolean;
  }): Promise<void> {
    try {
      const settingsToUpdate = [
        { key: 'slideshowInterval', value: settings.interval },
        { key: 'slideshowOpacity', value: settings.opacity },
        { key: 'slideshowOverlayOpacity', value: settings.overlayOpacity },
        { key: 'slideshowAutoPlay', value: settings.autoPlay }
      ].filter(setting => setting.value !== undefined);

      for (const setting of settingsToUpdate) {
        await query(
          `INSERT INTO site_settings (setting_key, setting_value, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (setting_key) 
           DO UPDATE SET setting_value = $2, updated_at = NOW()`,
          [setting.key, JSON.stringify(setting.value)]
        );
      }
    } catch (error) {
      console.error('Error updating slideshow settings:', error);
      throw error;
    }
  }
} 