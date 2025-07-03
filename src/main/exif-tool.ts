// Using a mock exiftool implementation for development
// In production, this would use the real exiftool-vendored

// Mock ExifTool implementation
class MockExifTool {
  async version() {
    return "Mock ExifTool 12.0";
  }

  async read(filePath: string) {
    console.log(`[Mock] Reading metadata from: ${filePath}`);
    return {
      SourceFile: filePath,
      DateTimeOriginal: new Date().toISOString(),
      GPSLatitude: 37.7749,
      GPSLongitude: -122.4194,
      GPSLatitudeRef: 'N',
      GPSLongitudeRef: 'W',
    };
  }

  async write(filePath: string, metadata: Record<string, any>) {
    console.log(`[Mock] Writing metadata to: ${filePath}`, metadata);
    return { 
      data: null, 
      error: null 
    };
  }

  end() {
    console.log('[Mock] ExifTool process ended');
  }
}

const mockExifTool = new MockExifTool();

export async function setupExifTool() {
  try {
    // For development, we'll use a mock implementation
    console.log('Using mock ExifTool implementation for development');
    return mockExifTool;

    // In production, we would use the real exiftool-vendored:
    // import { exiftool } from 'exiftool-vendored';
    // await exiftool.version();
    // return exiftool;
  } catch (error) {
    console.error('Failed to initialize ExifTool:', error);
    throw error;
  }
}

export async function readMetadata(filePath: string) {
  try {
    return await mockExifTool.read(filePath);
  } catch (error) {
    console.error(`Failed to read metadata for ${filePath}:`, error);
    return null;
  }
}

export async function writeMetadata(filePath: string, metadata: Record<string, any>) {
  try {
    return await mockExifTool.write(filePath, metadata);
  } catch (error) {
    console.error(`Failed to write metadata for ${filePath}:`, error);
    return null;
  }
}
