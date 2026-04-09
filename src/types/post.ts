export type PostStatus = "draft" | "published";

export interface FeaturedImage {
  url: string;
  alt: string;
  storagePath: string;
}

export interface PostAuthor {
  name: string;
  email: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: FeaturedImage;
  category: string;
  status: PostStatus;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  author: PostAuthor;
}
