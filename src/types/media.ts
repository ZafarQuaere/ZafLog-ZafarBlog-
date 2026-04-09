export interface MediaItem {
  id: string;
  url: string;
  storagePath: string;
  filename: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string | null;
}
