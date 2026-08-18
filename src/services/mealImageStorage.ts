/**
 * Meal Image Storage Service
 * Abstraction layer for storing meal images.
 * Current implementation: localStorage (base64 data URLs).
 * Future: Supabase Storage or cloud storage.
 *
 * Stores image URL/reference with meal ID and profile ownership.
 */

const IMAGE_STORAGE_PREFIX = 'ai_fitness_os_meal_images_';
const MAX_STORED_IMAGES = 50; // Limit localStorage usage

export interface StoredMealImage {
  id: string;
  mealId: string;
  userId: string;
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
  storedAt: string;
}

export class MealImageStorage {
  /**
   * Store a meal image. Returns a storage reference ID.
   */
  static storeImage(
    userId: string,
    mealId: string,
    dataUrl: string,
    mimeType: string,
    width: number,
    height: number
  ): string {
    const imageId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const stored: StoredMealImage = {
      id: imageId,
      mealId,
      userId,
      dataUrl,
      mimeType,
      width,
      height,
      storedAt: new Date().toISOString(),
    };

    try {
      const images = MealImageStorage.getUserImages(userId);

      // Enforce storage limit
      if (images.length >= MAX_STORED_IMAGES) {
        // Remove oldest images
        const sorted = images.sort(
          (a, b) => new Date(a.storedAt).getTime() - new Date(b.storedAt).getTime()
        );
        const toRemove = sorted.slice(0, images.length - MAX_STORED_IMAGES + 1);
        const toKeep = images.filter((img) => !toRemove.some((r) => r.id === img.id));
        toKeep.push(stored);
        localStorage.setItem(
          `${IMAGE_STORAGE_PREFIX}${userId}`,
          JSON.stringify(toKeep)
        );
      } else {
        images.push(stored);
        localStorage.setItem(
          `${IMAGE_STORAGE_PREFIX}${userId}`,
          JSON.stringify(images)
        );
      }

      return imageId;
    } catch (err) {
      console.error('Failed to store meal image:', err);
      // If localStorage is full, try to free space by removing oldest images
      MealImageStorage.cleanupOldImages(userId);
      try {
        const images = MealImageStorage.getUserImages(userId);
        images.push(stored);
        localStorage.setItem(
          `${IMAGE_STORAGE_PREFIX}${userId}`,
          JSON.stringify(images)
        );
        return imageId;
      } catch {
        console.error('Failed to store meal image after cleanup');
        return '';
      }
    }
  }

  /**
   * Retrieve a stored meal image by its ID.
   */
  static getImage(userId: string, imageId: string): StoredMealImage | null {
    const images = MealImageStorage.getUserImages(userId);
    return images.find((img) => img.id === imageId) || null;
  }

  /**
   * Get all images for a user.
   */
  static getUserImages(userId: string): StoredMealImage[] {
    try {
      const data = localStorage.getItem(`${IMAGE_STORAGE_PREFIX}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get the image associated with a specific meal.
   */
  static getImageForMeal(userId: string, mealId: string): StoredMealImage | null {
    const images = MealImageStorage.getUserImages(userId);
    return images.find((img) => img.mealId === mealId) || null;
  }

  /**
   * Delete a stored meal image.
   */
  static deleteImage(userId: string, imageId: string): boolean {
    const images = MealImageStorage.getUserImages(userId);
    const filtered = images.filter((img) => img.id !== imageId);
    if (filtered.length === images.length) return false;

    localStorage.setItem(
      `${IMAGE_STORAGE_PREFIX}${userId}`,
      JSON.stringify(filtered)
    );
    return true;
  }

  /**
   * Delete all images for a specific meal.
   */
  static deleteImagesForMeal(userId: string, mealId: string): number {
    const images = MealImageStorage.getUserImages(userId);
    const filtered = images.filter((img) => img.mealId !== mealId);
    const deleted = images.length - filtered.length;

    if (deleted > 0) {
      localStorage.setItem(
        `${IMAGE_STORAGE_PREFIX}${userId}`,
        JSON.stringify(filtered)
      );
    }

    return deleted;
  }

  /**
   * Cleanup old images to free localStorage space.
   * Keeps the most recent 20 images.
   */
  static cleanupOldImages(userId: string, keepCount: number = 20): void {
    const images = MealImageStorage.getUserImages(userId);
    if (images.length <= keepCount) return;

    const sorted = images.sort(
      (a, b) => new Date(b.storedAt).getTime() - new Date(a.storedAt).getTime()
    );
    const kept = sorted.slice(0, keepCount);

    localStorage.setItem(
      `${IMAGE_STORAGE_PREFIX}${userId}`,
      JSON.stringify(kept)
    );
  }

  /**
   * Get total storage size used by meal images for a user (approximate bytes).
   */
  static getStorageSize(userId: string): number {
    try {
      const data = localStorage.getItem(`${IMAGE_STORAGE_PREFIX}${userId}`);
      return data ? new Blob([data]).size : 0;
    } catch {
      return 0;
    }
  }
}
