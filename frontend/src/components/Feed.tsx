
import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { apiService } from '../services/api';
import { Post, User } from '../types';
import { PostCard } from './PostCard';

interface FeedProps {
  currentUser: User;
  onKarmaUpdate: () => void;
}

export const Feed: React.FC<FeedProps> = ({ currentUser, onKarmaUpdate }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPosts();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setIsSubmitting(true);
    
    try {
      await apiService.createPost(newPostContent);
      setNewPostContent('');
      await fetchPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await apiService.likePost(postId);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const isCurrentlyLiked = p.isLiked;
          return { 
            ...p, 
            isLiked: !isCurrentlyLiked, 
            likesCount: isCurrentlyLiked ? p.likesCount - 1 : p.likesCount + 1 
          };
        }
        return p;
      }));
      onKarmaUpdate();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Create Post Card */}
      <Card className="transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-indigo-100">
        <CardContent className="p-5">
          <div className="flex gap-4">
            <div className="shrink-0">
              <Avatar>
                <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
                <AvatarFallback>{currentUser.username.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 space-y-4">
              <textarea
                placeholder="What's happening in the community?"
                className="w-full resize-none border-none bg-transparent text-lg font-medium placeholder:text-slate-400 focus:outline-none focus:ring-0"
                rows={2}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="flex gap-2 text-slate-400">
                  <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isSubmitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  ) : null}
                  Post to Feed
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed List */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 w-full animate-pulse rounded-2xl bg-slate-200/50"></div>
            ))}
          </div>
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onLike={() => handleLike(post.id)} 
              onCommentUpdate={onKarmaUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
};
