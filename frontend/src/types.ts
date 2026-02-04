export interface User {
  id: string;
  username: string;
  avatar: string;
  totalKarma: number;
  recentKarma?: number;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
  isLiked: boolean;
  likesCount: number;
  replies?: Comment[];
  parentId?: string | null;
}

export interface Post {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
}
