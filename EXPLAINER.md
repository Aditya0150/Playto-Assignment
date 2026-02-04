# Project Explainer - Community Feed

## 1. The Tree: Modeling Nested Comments
- Model: `Comment` uses a self-referential `parent` foreign key and a `post` foreign key.
- Fetch: `PostViewSet.comments` loads all comments for a post in one query:
  `Comment.objects.filter(post=post).annotate(like_count=Count('likes')).select_related('author').order_by('timestamp')`
- Serialize: The view builds an in-memory parent/child map and attaches `prefetched_replies` lists. `CommentSerializer.get_replies` uses `prefetched_replies` when present, so it does not hit the DB per node.

This keeps DB work to one query for the full tree (plus the post lookup), regardless of nesting depth.

## 2. The Math: 24h Leaderboard QuerySets
In `LeaderboardViewSet.list`, the "last 24h" karma is computed with these QuerySets:

```python
now = timezone.now()
yesterday = now - timedelta(hours=24)

for user in User.objects.all():
    post_likes = Like.objects.filter(
        post__author=user,
        timestamp__gte=yesterday
    ).count()
    recent_post_karma = post_likes * 5

    comment_likes = Like.objects.filter(
        comment__author=user,
        timestamp__gte=yesterday
    ).count()
    recent_comment_karma = comment_likes * 1

    recent_karma = recent_post_karma + recent_comment_karma
```

Users with `recent_karma > 0` are kept, then the list is sorted by `recent_karma` and truncated to the top 5.

## 3. The AI Audit: Example Fix
The AI's first pass serialized replies with `obj.replies.all()` directly in the serializer recursion. That triggers an N+1 query pattern as depth grows. I fixed it by moving the tree assembly into `PostViewSet.comments`, fetching all comments in one query and attaching `prefetched_replies`, which the serializer now uses to avoid extra DB hits.
