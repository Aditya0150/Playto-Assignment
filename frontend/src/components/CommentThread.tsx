
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { apiService } from '../services/api';
import { Comment } from '../types';

interface CommentThreadProps {
  comment: Comment;
  postId: string;
  onUpdate: () => void;
  depth?: number;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ 
  comment, 
  postId, 
  onUpdate, 
  depth = 0 
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleLike = async () => {
    try {
      await apiService.likeComment(comment.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await apiService.createComment(postId, comment.id, replyText);
      setReplyText('');
      setIsReplying(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to reply to comment:', error);
    }
  };

  const MAX_DEPTH = 4;

  return (
    <div className={`relative ${depth > 0 ? 'mt-5' : ''}`}>
      {/* Thread Visual Line */}
      {depth > 0 && (
        <div className="absolute -left-6 top-0 bottom-0 w-0.5 bg-slate-100 rounded-full" />
      )}

      <div className="flex gap-4">
        <div className="shrink-0 z-10">
          <Avatar className={depth === 0 ? 'h-9 w-9' : 'h-8 w-8'}>
            <AvatarImage src={comment.author.avatar} alt={comment.author.username} />
            <AvatarFallback>{comment.author.username.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="relative rounded-2xl bg-white p-4 shadow-sm border border-slate-100 transition-all hover:border-slate-200">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900">{comment.author.username}</span>
              <span className="text-[10px] font-bold text-slate-300">
                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">{comment.content}</p>
          </div>

          <div className="flex items-center gap-5 px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-[11px] font-extrabold transition-colors ${
                comment.isLiked ? 'text-rose-600 hover:text-rose-700' : 'text-slate-400 hover:text-rose-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${comment.isLiked ? 'fill-current' : 'fill-none stroke-current stroke-2'}`} viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>{comment.likesCount}</span>
            </Button>
            
            {depth < MAX_DEPTH && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className={`text-[11px] font-extrabold transition-colors ${
                  isReplying ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'
                }`}
              >
                Reply
              </Button>
            )}
          </div>

          {isReplying && (
            <div className="mt-4 flex gap-2">
              <Input 
                placeholder={`Reply to ${comment.author.username}...`}
                autoFocus
                value={replyText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReplyText(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleReply()}
                className="text-xs"
              />
              <Button 
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px]"
              >
                Send
              </Button>
            </div>
          )}

          {/* Recursive Replies Container */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-6 border-l-2 border-slate-50 pl-6">
              {comment.replies.map((reply) => (
                <CommentThread 
                  key={reply.id} 
                  comment={reply} 
                  postId={postId}
                  onUpdate={onUpdate}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
