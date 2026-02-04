
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { apiService } from '../services/api';
import { Comment, Post } from '../types';
import { CommentThread } from './CommentThread';

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onCommentUpdate: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onCommentUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isTreeLoading, setIsTreeLoading] = useState(false);

  const toggleComments = async () => {
    if (!showComments) {
      setIsTreeLoading(true);
      try {
        const tree = await apiService.getComments(post.id);
        setComments(tree);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      } finally {
        setIsTreeLoading(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await apiService.createComment(post.id, null, newComment);
      setNewComment('');
      const updatedComments = await apiService.getComments(post.id);
      setComments(updatedComments);
      onCommentUpdate();
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  return (
    <Card className="transition-all hover:border-slate-300">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.author.avatar} alt={post.author.username} />
              <AvatarFallback>{post.author.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{post.author.username}</h3>
              <p className="text-[11px] font-medium text-slate-400">
                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex h-6 items-center rounded-full bg-slate-100 px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Topic
          </div>
        </div>
        
        <p className="text-slate-800 leading-relaxed text-lg font-medium mb-6">
          {post.content}
        </p>

        <div className="flex items-center gap-4 border-t border-slate-50 pt-4">
          <Button 
            onClick={onLike}
            variant={post.isLiked ? "ghost" : "ghost"}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              post.isLiked 
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-rose-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${post.isLiked ? 'fill-current' : 'fill-none stroke-current stroke-2'}`} viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>{post.likesCount}</span>
          </Button>
          
          <Button 
            onClick={toggleComments}
            variant={showComments ? "ghost" : "ghost"}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              showComments 
              ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span>{post.commentsCount} Comments</span>
          </Button>
        </div>
      </CardContent>

      {showComments && (
        <div className="rounded-b-2xl border-t border-slate-100 bg-[#fbfcfd] p-6">
          {/* New top-level comment input */}
          <div className="mb-8 flex gap-3">
            <Input 
              placeholder="Share your perspective..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              className="rounded-2xl"
            />
            <Button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Reply
            </Button>
          </div>

          <div className="space-y-6">
            {isTreeLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : (
              <>
                {comments.map(comment => (
                  <CommentThread 
                    key={comment.id} 
                    comment={comment} 
                    postId={post.id}
                    onUpdate={async () => {
                      const updatedComments = await apiService.getComments(post.id);
                      setComments(updatedComments);
                      onCommentUpdate();
                    }}
                  />
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm font-bold text-slate-300">No responses yet</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
