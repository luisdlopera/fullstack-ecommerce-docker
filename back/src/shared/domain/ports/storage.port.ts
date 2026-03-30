export const STORAGE_PORT = Symbol('STORAGE_PORT');

export type StorageUploadInput = {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
};

export interface StoragePort {
  upload(input: StorageUploadInput): Promise<void>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
