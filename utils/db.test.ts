
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { addFile } from './db';
import 'fake-indexeddb/auto';

// Mock FileReader and Image
const originalFileReader = global.FileReader;
const originalImage = global.Image;

describe('addFile with invalid image', () => {
  beforeAll(() => {
    // Mock FileReader
    class MockFileReader {
      onload: ((event: any) => void) | null = null;
      onerror: ((error: any) => void) | null = null;
      readAsDataURL(file: Blob) {
          setTimeout(() => {
              if (this.onload) {
                  this.onload({ target: { result: 'data:image/png;base64,fake' } });
              }
          }, 10);
      }
    }
    global.FileReader = MockFileReader as any;

    // Mock Image
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src: string = '';
      width: number = 100;
      height: number = 100;

      set src(value: string) {
          this._src = value;
           // Simulate error for specific test case
          setTimeout(() => {
               if (this.onerror) {
                   this.onerror();
               }
          }, 20);
      }
      get src() { return this._src; }
      private _src: string = '';
    }
    global.Image = MockImage as any;

    // Mock HTMLCanvasElement.getContext because we might reach it if we don't error out properly
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
        drawImage: vi.fn(),
    }));
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => callback(new Blob(['fake'], {type: 'image/jpeg'})));

  });

  afterAll(() => {
    global.FileReader = originalFileReader;
    global.Image = originalImage;
  });

  it('should handle image load error by falling back to original file', async () => {
    const file = new File(['fake content'], 'test.png', { type: 'image/png' });
    // We need to make the file large enough to trigger compression logic
    Object.defineProperty(file, 'size', { value: 300 * 1024 });

    // We expect addFile to eventually resolve (falling back to original file)
    // or at least not hang forever.
    // Since the bug is that it hangs, we can't easily test "hangs" without a timeout.
    // But if we fix it, it should resolve.

    // However, without the fix, the promise returned by compressImage will never settle
    // if onerror is not handled.
    // So addFile will await forever.

    // We can wrap it in a race with a timeout to demonstrate the hang,
    // but for the "fix verification", we just want to ensure it resolves.

    const result = await Promise.race([
        addFile(file),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
    ]);

    expect(result).toBeDefined();
  });
});
