from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework import viewsets, permissions, status, response
from rest_framework.decorators import action, api_view, permission_classes
from django.db.models import Count, Sum, Case, When, IntegerField, Q, Prefetch
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from .models import Post, Comment, Like
from .serializers import PostSerializer, CommentSerializer, UserSerializer, LikeSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.annotate(
        like_count=Count('likes', distinct=True),
        comment_count=Count('comments', distinct=True)
    ).order_by('-timestamp')
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # Use the current user if authenticated, otherwise create anonymous posts with a default user
        if self.request.user.is_authenticated:
            serializer.save(author=self.request.user)
        else:
            # Get or create a default "Guest" user for unauthenticated posts
            default_user, _ = User.objects.get_or_create(username='guest', defaults={'is_active': True})
            serializer.save(author=default_user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        # Use authenticated user or create guest user for likes
        if request.user.is_authenticated:
            user = request.user
        else:
            user, _ = User.objects.get_or_create(username='guest', defaults={'is_active': True})
        
        like, created = Like.objects.get_or_create(user=user, post=post)
        if not created:
            like.delete()
            return response.Response({'status': 'unliked'}, status=status.HTTP_200_OK)
        return response.Response({'status': 'liked'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        post = self.get_object()
        # To avoid N+1, we fetch all comments for this post in one go.
        # Then we build the tree in memory.
        all_comments = Comment.objects.filter(post=post).annotate(
            like_count=Count('likes')
        ).select_related('author').order_by('timestamp')
        
        # Build a parent-child mapping
        comment_map = {c.id: c for c in all_comments}
        root_comments = []
        for c in all_comments:
            c.prefetched_replies = []
            if c.parent_id:
                parent = comment_map.get(c.parent_id)
                if parent:
                    if not hasattr(parent, 'prefetched_replies'):
                        parent.prefetched_replies = []
                    parent.prefetched_replies.append(c)
            else:
                root_comments.append(c)
        
        serializer = CommentSerializer(root_comments, many=True, context={'request': request})
        return response.Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.annotate(like_count=Count('likes'))
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        """
        Create a comment with the authenticated user as author.
        If not authenticated, use guest user.
        """
        print(f"DEBUG: Creating comment. User authenticated: {self.request.user.is_authenticated}")
        print(f"DEBUG: User: {self.request.user}")
        
        if self.request.user.is_authenticated:
            print(f"DEBUG: Saving comment with author: {self.request.user.username}")
            serializer.save(author=self.request.user)
        else:
            default_user, _ = User.objects.get_or_create(username='guest', defaults={'is_active': True})
            print(f"DEBUG: Saving comment with guest author")
            serializer.save(author=default_user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        comment = self.get_object()
        print(f"DEBUG: Like comment. Authenticated user: {request.user.is_authenticated}")
        print(f"DEBUG: Comment author: {comment.author.username}")
        print(f"DEBUG: Comment ID: {pk}")
        
        # Use authenticated user or create guest user for likes
        if request.user.is_authenticated:
            user = request.user
            print(f"DEBUG: Like from user: {user.username}")
        else:
            user, _ = User.objects.get_or_create(username='guest', defaults={'is_active': True})
            print(f"DEBUG: Like from guest user")
        
        like, created = Like.objects.get_or_create(user=user, comment=comment)
        if not created:
            like.delete()
            print(f"DEBUG: Unlike - like deleted")
            return response.Response({'status': 'unliked'}, status=status.HTTP_200_OK)
        print(f"DEBUG: Like created. Comment author karma should increase by 1")
        return response.Response({'status': 'liked'}, status=status.HTTP_201_CREATED)

class LeaderboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        now = timezone.now()
        yesterday = now - timedelta(hours=24)

        # Calculate karma based on likes RECEIVED on user's posts/comments
        # NOT likes created by the user
        users_data = []
        
        for user in User.objects.all():
            # Count likes on this user's posts in last 24h
            post_likes = Like.objects.filter(
                post__author=user,
                timestamp__gte=yesterday
            ).count()
            recent_post_karma = post_likes * 5
            
            # Count likes on this user's comments in last 24h
            comment_likes = Like.objects.filter(
                comment__author=user,
                timestamp__gte=yesterday
            ).count()
            recent_comment_karma = comment_likes * 1
            
            recent_karma = recent_post_karma + recent_comment_karma
            
            # Calculate all-time karma
            post_likes_total = Like.objects.filter(post__author=user).count()
            total_post_karma = post_likes_total * 5
            
            comment_likes_total = Like.objects.filter(comment__author=user).count()
            total_comment_karma = comment_likes_total * 1
            
            total_karma = total_post_karma + total_comment_karma
            
            if recent_karma > 0:  # Only include users with recent activity
                users_data.append({
                    'id': user.id,
                    'username': user.username,
                    'recent_karma': recent_karma,
                    'total_karma': total_karma,
                })
        
        # Sort by recent karma and take top 5
        users_data.sort(key=lambda x: x['recent_karma'], reverse=True)
        return response.Response(users_data[:5])


# Auth endpoints
@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """Login user and set session"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return response.Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(request, username=username, password=password)
    if user is None:
        return response.Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    login(request, user)
    
    # Calculate karma for this user
    now = timezone.now()
    yesterday = now - timedelta(hours=24)
    
    post_likes = Like.objects.filter(post__author=user, timestamp__gte=yesterday).count() * 5
    comment_likes = Like.objects.filter(comment__author=user, timestamp__gte=yesterday).count() * 1
    recent_karma = post_likes + comment_likes
    
    post_likes_total = Like.objects.filter(post__author=user).count() * 5
    comment_likes_total = Like.objects.filter(comment__author=user).count() * 1
    total_karma = post_likes_total + comment_likes_total
    
    # Return user info
    return response.Response({
        'id': user.id,
        'username': user.username,
        'avatar': f'https://api.dicebear.com/7.x/avataaars/svg?seed={user.username}',
        'totalKarma': total_karma,
        'recentKarma': recent_karma,
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def logout_view(request):
    """Logout user"""
    logout(request)
    return response.Response({'status': 'logged out'})


@api_view(['GET'])
@ensure_csrf_cookie
@permission_classes([permissions.AllowAny])
def me_view(request):
    """Get current authenticated user"""
    if request.user.is_authenticated:
        # Calculate karma for this user based on likes RECEIVED
        now = timezone.now()
        yesterday = now - timedelta(hours=24)
        
        # Likes on this user's POSTS in last 24h
        post_likes_recent = Like.objects.filter(
            post__author=request.user, 
            timestamp__gte=yesterday
        )
        post_likes_count = post_likes_recent.count()
        
        # Likes on this user's COMMENTS in last 24h
        comment_likes_recent = Like.objects.filter(
            comment__author=request.user, 
            timestamp__gte=yesterday
        )
        comment_likes_count = comment_likes_recent.count()
        
        recent_karma = (post_likes_count * 5) + (comment_likes_count * 1)
        
        # All-time karma
        post_likes_total = Like.objects.filter(post__author=request.user).count()
        comment_likes_total = Like.objects.filter(comment__author=request.user).count()
        total_karma = (post_likes_total * 5) + (comment_likes_total * 1)
        
        return response.Response({
            'id': request.user.id,
            'username': request.user.username,
            'avatar': f'https://api.dicebear.com/7.x/avataaars/svg?seed={request.user.username}',
            'totalKarma': total_karma,
            'recentKarma': recent_karma,
        })
    else:
        return response.Response({
            'id': '1',
            'username': 'Guest',
            'avatar': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
            'totalKarma': 0,
            'recentKarma': 0,
        })
