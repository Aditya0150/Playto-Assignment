# Project Explainer - Community Feed

## 1. The Tree: Modeling Nested Comments
I chose a **self-referential foreign key** approach for modeling the nested comments.
- **Model**: Each `Comment` has a `parent` field pointing back to `Comment`.
- **N+1 Solution**: To avoid the "N+1 Nightmare", I implemented a custom action in the `PostViewSet`. Instead of letting the serializer fetch children recursively (which triggers a query per comment), I fetch **all** comments for a post in a single optimized query using `.select_related('author')`.
- **In-Memory Tree Build**: I then build the parent-child relationships in memory (O(N) time complexity) and attach `prefetched_replies` to each comment. The serializer then uses these pre-built lists, resulting in exactly **1 SQL query** for the entire comment tree regardless of depth.

## 2. The Math: 24h Leaderboard Query
The leaderboard is calculated dynamically using Django's aggregation framework.

```python
now = timezone.now()
yesterday = now - timedelta(hours=24)

users = User.objects.annotate(
    total_karma=Sum(
        Case(
            When(likes__post__isnull=False, likes__timestamp__gte=yesterday, then=5),
            When(likes__comment__isnull=False, likes__timestamp__gte=yesterday, then=1),
            default=0,
            output_field=IntegerField()
        )
    )
).filter(total_karma__gt=0).order_by('-total_karma')[:5]
```

**Why this works:**
- It uses `Sum` with `Case/When` to assign weight (5 for posts, 1 for comments).
- It applies a filter *inside* the aggregation to only count likes within the `yesterday` (last 24h) threshold.
- It filters out users with 0 karma and limits to the top 5.

## 3. The AI Audit: Fixing Inefficiencies
**The Issue**: Initially, the AI suggested using `django-mptt` for the tree. While `mptt` is great for deep trees, it adds overhead for writes (recalculating tree pointers). For a community feed where comments are frequent, a simple parent-child relationship with an in-memory tree build is often more performant for typical discussion depths.
**The Fix**: I replaced the `mptt` suggestion with a single-query fetch and in-memory build. This ensures that even if a thread is 10 levels deep, we only ever hit the database once for the comments.
**Another Fix**: The AI initially forgot to handle the "double-like" race condition at the database level. I added `UniqueConstraint` on the `Like` model to ensure that even if two concurrent requests hit the server, the database will enforce a single like per user per target.
