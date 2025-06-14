import fs from 'fs';
import { Readable } from 'stream';

import sharp from 'sharp';

import { deleteImage, uploadImage } from '@/utils/multer.utils';

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');

  return {
    ...actualFs,
    promises: {
      ...actualFs.promises,
      mkdir: jest.fn(),
    },
    existsSync: jest.fn(),
    unlinkSync: jest.fn(),
  };
});

jest.mock('sharp');
jest.mock('@/utils/dayjs.utils', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    format: jest.fn(() => '2025-01-01-12-00-00'),
  })),
}));

describe('multer.utils', () => {
  const fakeBuffer = Buffer.from('test-image');
  const file: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1024,
    stream: null as unknown as Readable,
    destination: '',
    filename: '',
    path: '',
    buffer: fakeBuffer,
  };

  const mockToFile = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
    (sharp as unknown as jest.Mock).mockReturnValue({
      resize: () => ({ toFormat: () => ({ png: () => ({ toFile: mockToFile }) }) }),
    });
  });

  describe('uploadImage', () => {
    it('should process and save the image and return correct path', async () => {
      const result = await uploadImage(file, 'restaurant');

      expect(fs.promises.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('uploads/restaurant'),
        { recursive: true }
      );
      expect(mockToFile).toHaveBeenCalledWith(expect.stringContaining('2025-01-01-12-00-00.png'));
      expect(result).toBe('/uploads/restaurant/2025-01-01-12-00-00.png');
    });

    it('should throw if no file is provided', async () => {
      await expect(
        uploadImage(null as unknown as Express.Multer.File, 'restaurant')
      ).rejects.toThrow('No file provided');
    });
  });

  describe('deleteImage', () => {
    it('should delete the image if it exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const unlinkSyncMock = fs.unlinkSync as jest.Mock;

      deleteImage('uploads/restaurant/test.png');

      expect(unlinkSyncMock).toHaveBeenCalledWith(
        expect.stringContaining('uploads/restaurant/test.png')
      );
    });

    it('should not throw if file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      expect(() => deleteImage('uploads/restaurant/missing.png')).not.toThrow();
    });
  });
});
