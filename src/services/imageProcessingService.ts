/**
 * Image Processing Service
 * Client-side image capture, upload, resize, and compression.
 * Never sends raw camera photos to Gemini — always compresses first.
 */

export interface ProcessedImage {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  processedSize: number;
  mimeType: string;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 - 1.0
  outputFormat?: 'image/jpeg' | 'image/webp';
}

const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.82,
  outputFormat: 'image/jpeg',
};

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export class ImageProcessingService {
  /**
   * Open file picker for meal photo upload.
   * Returns processed image or null if cancelled.
   */
  static async pickFromGallery(
    options?: ImageProcessingOptions
  ): Promise<ProcessedImage | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.capture = undefined; // gallery, not camera

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const processed = await ImageProcessingService.processFile(file, options);
          resolve(processed);
        } catch (err) {
          console.error('Image processing failed:', err);
          resolve(null);
        }
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  /**
   * Open device camera for live capture.
   * Falls back to file picker if camera not available.
   */
  static async captureFromCamera(
    options?: ImageProcessingOptions
  ): Promise<ProcessedImage | null> {
    // Check if camera capture is supported
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.capture = 'environment'; // rear camera

    return new Promise((resolve) => {
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const processed = await ImageProcessingService.processFile(file, options);
          resolve(processed);
        } catch (err) {
          console.error('Camera capture processing failed:', err);
          resolve(null);
        }
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  /**
   * Process a raw File into a compressed ProcessedImage.
   * Validates type and size, resizes to fit within max dimensions, compresses.
   */
  static async processFile(
    file: File,
    options?: ImageProcessingOptions
  ): Promise<ProcessedImage> {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error(
        `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP.`
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Max: 15 MB.`
      );
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const originalSize = file.size;

    const img = await ImageProcessingService.loadImageFromFile(file);
    const { width, height } = ImageProcessingService.calculateResize(
      img.naturalWidth,
      img.naturalHeight,
      opts.maxWidth,
      opts.maxHeight
    );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas 2D context');

    ctx.drawImage(img, 0, 0, width, height);

    const blob = await ImageProcessingService.canvasToBlob(
      canvas,
      opts.outputFormat,
      opts.quality
    );

    const dataUrl = await ImageProcessingService.blobToDataUrl(blob);

    return {
      dataUrl,
      blob,
      width,
      height,
      originalSize,
      processedSize: blob.size,
      mimeType: opts.outputFormat,
    };
  }

  /**
   * Encode a ProcessedImage as base64 for sending to Gemini API.
   * Strips the data URL prefix, returns raw base64.
   */
  static toBase64(processedImage: ProcessedImage): string {
    const prefix = `data:${processedImage.mimeType};base64,`;
    if (processedImage.dataUrl.startsWith(prefix)) {
      return processedImage.dataUrl.slice(prefix.length);
    }
    // Fallback: extract from data URL
    return processedImage.dataUrl.split(',')[1] || '';
  }

  /**
   * Validate that an image file is acceptable before processing.
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_TYPES.has(file.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type}. Please use JPEG, PNG, or WebP.`,
      };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 15 MB.`,
      };
    }
    return { valid: true };
  }

  // ── Private helpers ──

  private static loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image from file'));
      };
      img.src = url;
    });
  }

  private static calculateResize(
    origW: number,
    origH: number,
    maxW: number,
    maxH: number
  ): { width: number; height: number } {
    if (origW <= maxW && origH <= maxH) {
      return { width: origW, height: origH };
    }
    const ratio = Math.min(maxW / origW, maxH / origH);
    return {
      width: Math.round(origW * ratio),
      height: Math.round(origH * ratio),
    };
  }

  private static canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        type,
        quality
      );
    });
  }

  private static blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read blob as data URL'));
      reader.readAsDataURL(blob);
    });
  }
}
