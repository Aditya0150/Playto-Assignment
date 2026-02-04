from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Comment, Like

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'user', 'post', 'comment', 'timestamp']

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    like_count = serializers.IntegerField(read_only=True)
    user_has_liked = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'parent', 'author', 'content', 'timestamp', 'replies', 'like_count', 'user_has_liked']

    def get_replies(self, obj):
        # This will be used for nested serializing. 
        # Note: We need to handle this carefully to avoid N+1 in the view/queryset logic.
        if hasattr(obj, 'prefetched_replies'):
            return CommentSerializer(obj.prefetched_replies, many=True, context=self.context).data
        return CommentSerializer(obj.replies.all(), many=True, context=self.context).data

    def get_user_has_liked(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return Like.objects.filter(user=user, comment=obj).exists()
        return False

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    user_has_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'timestamp', 'like_count', 'comment_count', 'user_has_liked']

    def get_user_has_liked(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return Like.objects.filter(user=user, post=obj).exists()
        return False
