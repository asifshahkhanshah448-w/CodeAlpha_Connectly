/**
 * Centralized API Client for Connectly
 * Uses VITE_API_BASE_URL (or falls back to /api for relative same-origin deployment)
 */

const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL) ||
  '/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('connectly_token');
  }

  public setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('connectly_token', token);
    }
  }

  public removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('connectly_token');
      localStorage.removeItem('connectly_user');
    }
  }

  public async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({
        success: false,
        message: `HTTP error ${response.status}`,
      }));

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data as T;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected network or server error occurred.');
    }
  }

  // Auth methods
  async register(userData: Record<string, unknown>) {
    return this.request<{ success: boolean; token: string; user: any; message: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(userData) }
    );
  }

  async login(credentials: { identifier: string; password: string }) {
    return this.request<{ success: boolean; token: string; user: any; message: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(credentials) }
    );
  }

  async getMe() {
    return this.request<{ success: boolean; user: any }>('/auth/me');
  }

  async logout() {
    this.removeToken();
    return this.request<{ success: boolean; message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  // Users & Profiles
  async getProfile(username: string) {
    return this.request<{ success: boolean; user: any; posts: any[] }>(
      `/users/profile/${username}`
    );
  }

  async updateProfile(profileData: {
    name?: string;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
  }) {
    return this.request<{ success: boolean; user: any; message: string }>(
      '/users/edit-profile',
      { method: 'PUT', body: JSON.stringify(profileData) }
    );
  }

  async discoverUsers() {
    return this.request<{ success: boolean; users: any[] }>('/users/discover');
  }

  async searchUsers(query: string) {
    return this.request<{ success: boolean; users: any[] }>(
      `/users/search?q=${encodeURIComponent(query)}`
    );
  }

  // Follow / Unfollow
  async followUser(userId: string) {
    return this.request<{
      success: boolean;
      message: string;
      isFollowing: boolean;
      targetFollowersCount: number;
    }>(`/users/${userId}/follow`, { method: 'POST' });
  }

  async unfollowUser(userId: string) {
    return this.request<{
      success: boolean;
      message: string;
      isFollowing: boolean;
      targetFollowersCount: number;
    }>(`/users/${userId}/follow`, { method: 'DELETE' });
  }

  // Posts Feed & CRUD
  async getFeed(params: { page?: number; limit?: number; tab?: string; tag?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.tab) query.append('tab', params.tab);
    if (params.tag) query.append('tag', params.tag);

    return this.request<{
      success: boolean;
      posts: any[];
      pagination: {
        page: number;
        limit: number;
        totalPosts: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>(`/posts?${query.toString()}`);
  }

  async getPost(postId: string) {
    return this.request<{ success: boolean; post: any }>(`/posts/${postId}`);
  }

  async createPost(postData: { content: string; image?: string }) {
    return this.request<{ success: boolean; post: any; message: string }>('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async updatePost(postId: string, postData: { content: string; image?: string }) {
    return this.request<{ success: boolean; post: any; message: string }>(
      `/posts/${postId}`,
      { method: 'PUT', body: JSON.stringify(postData) }
    );
  }

  async deletePost(postId: string) {
    return this.request<{ success: boolean; message: string }>(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // Likes
  async likePost(postId: string) {
    return this.request<{
      success: boolean;
      message: string;
      likesCount: number;
      isLiked: boolean;
    }>(`/posts/${postId}/like`, { method: 'POST' });
  }

  async unlikePost(postId: string) {
    return this.request<{
      success: boolean;
      message: string;
      likesCount: number;
      isLiked: boolean;
    }>(`/posts/${postId}/like`, { method: 'DELETE' });
  }

  // Comments
  async getComments(postId: string) {
    return this.request<{ success: boolean; comments: any[]; count: number }>(
      `/posts/${postId}/comments`
    );
  }

  async addComment(postId: string, content: string) {
    return this.request<{ success: boolean; comment: any; message: string }>(
      `/posts/${postId}/comments`,
      { method: 'POST', body: JSON.stringify({ content }) }
    );
  }

  async deleteComment(commentId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/comments/${commentId}`,
      { method: 'DELETE' }
    );
  }

  // Health
  async checkHealth() {
    return this.request<{
      status: string;
      service: string;
      databaseConnected: boolean;
      uptime: number;
      timestamp: string;
    }>('/health');
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
