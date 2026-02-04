const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Helper to get avatar
function getAvatar(username: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
}

// Read cookie (used to get CSRF token)
function getCookie(name: string): string | null {
  const matches = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return matches ? decodeURIComponent(matches[2]) : null;
}

// Helper to fetch CSRF token from server
async function ensureCSRFToken() {
  const existing = getCookie('csrftoken');
  if (existing) return existing;

  try {
    // Make a GET request to trigger CSRF token generation
    await fetch(`${API_BASE_URL}/posts/`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    return getCookie('csrftoken');
  } catch (e) {
    console.warn('Could not fetch CSRF token');
    return null;
  }
}

// Helper for API calls with error handling
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const method = (options.method || 'GET').toString().toUpperCase();

  // Merge headers and add CSRF token for mutating requests
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (method !== 'GET' && method !== 'HEAD') {
    let csrftoken = getCookie('csrftoken');
    if (!csrftoken) {
      csrftoken = await ensureCSRFToken();
    }
    if (csrftoken) {
      headers['X-CSRFToken'] = csrftoken;
    }
  }

  const fetchOptions: RequestInit = {
    credentials: 'include', // send cookies for session auth
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (e) { }
      console.error(`API Error ${response.status} for ${endpoint}:`, errorBody);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

export const apiService = {
  // Posts
  async getPosts() {
    const data = await apiCall('/posts/');
    return data.map((post: any) => ({
      id: String(post.id),
      content: post.content,
      author: {
        id: String(post.author.id),
        username: post.author.username,
        avatar: getAvatar(post.author.username),
        totalKarma: 0,
      },
      createdAt: new Date(post.timestamp),
      isLiked: post.user_has_liked,
      likesCount: post.like_count || 0,
      commentsCount: post.comment_count || 0,
    }));
  },

  async createPost(content: string) {
    return await apiCall('/posts/', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async likePost(postId: string) {
    return await apiCall(`/posts/${postId}/like/`, {
      method: 'POST',
    });
  },

  // Comments
  async getComments(postId: string) {
    const data = await apiCall(`/posts/${postId}/comments/`);
    return this.transformComments(data);
  },

  transformComments(comments: any[]): any[] {
    return comments.map(comment => ({
      id: String(comment.id),
      content: comment.content,
      author: {
        id: String(comment.author.id),
        username: comment.author.username,
        avatar: getAvatar(comment.author.username),
        totalKarma: 0,
      },
      createdAt: new Date(comment.timestamp),
      isLiked: comment.user_has_liked,
      likesCount: comment.like_count || 0,
      parentId: comment.parent ? String(comment.parent) : null,
      replies: comment.replies ? this.transformComments(comment.replies) : [],
    }));
  },

  async createComment(postId: string, parentId: string | null, content: string) {
    return await apiCall('/comments/', {
      method: 'POST',
      body: JSON.stringify({
        post: postId,
        parent: parentId,
        content,
      }),
    });
  },

  async likeComment(commentId: string) {
    return await apiCall(`/comments/${commentId}/like/`, {
      method: 'POST',
    });
  },

  // Leaderboard
  async getLeaderboard() {
    const data = await apiCall('/leaderboard/');
    return data.map((user: any) => ({
      id: String(user.id),
      username: user.username,
      avatar: getAvatar(user.username),
      totalKarma: user.total_karma || 0,
      recentKarma: user.recent_karma || 0,
    }));
  },

  // Current User
  async getCurrentUser() {
    try {
      // Get current user from /me endpoint
      return await apiCall('/me/');
    } catch (error) {
      console.log('Could not fetch current user from API');
    }

    // Fallback to guest user
    return {
      id: '1',
      username: 'Guest',
      avatar: getAvatar('Guest'),
      totalKarma: 0,
      recentKarma: 0,
    };
  },

  // Authentication
  async login(username: string, password: string) {
    return await apiCall('/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async logout() {
    return await apiCall('/logout/', {
      method: 'POST',
    });
  },
};
