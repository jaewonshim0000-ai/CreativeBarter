/**
 * Centralized API client for communicating with the backend.
 * Handles authentication headers and response parsing.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /** Get the stored JWT token. */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem('token');
  }

  /** Build headers with optional auth token. */
  private headers(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extra,
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /** Generic fetch wrapper with error handling. */
  private async request<T>(
    method: string,
    path: string,
    body?: any,
    params?: Record<string, string>
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    if (params) {
      const searchParams = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      );
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    const response = await fetch(url, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ===================== Auth =====================

  async register(email: string, password: string, name: string) {
    return this.request<any>('POST', '/api/auth/register', { email, password, name });
  }

  async login(email: string, password: string) {
    return this.request<any>('POST', '/api/auth/login', { email, password });
  }

  // ===================== Users =====================

  async getMyProfile() {
    return this.request<any>('GET', '/api/users/me');
  }

  async getUserById(id: string) {
    return this.request<any>('GET', `/api/users/${id}`);
  }

  async updateProfile(data: any) {
    return this.request<any>('PUT', '/api/users/me', data);
  }

  async searchUsers(params: Record<string, string>) {
    return this.request<any>('GET', '/api/users/search', undefined, params);
  }

  async addSkill(skillId: string, proficiency: string, yearsExperience: number) {
    return this.request<any>('POST', '/api/users/me/skills', { skillId, proficiency, yearsExperience });
  }

  async removeSkill(skillId: string) {
    return this.request<any>('DELETE', `/api/users/me/skills/${skillId}`);
  }

  // ===================== Projects =====================

  async getProjects(params?: Record<string, string>) {
    return this.request<any>('GET', '/api/projects', undefined, params);
  }

  async getProject(id: string) {
    return this.request<any>('GET', `/api/projects/${id}`);
  }

  async createProject(data: any) {
    return this.request<any>('POST', '/api/projects', data);
  }

  async updateProject(id: string, data: any) {
    return this.request<any>('PUT', `/api/projects/${id}`, data);
  }

  async deleteProject(id: string) {
    return this.request<any>('DELETE', `/api/projects/${id}`);
  }

  // ===================== Matches =====================

  async getMatches(status?: string) {
    return this.request<any>('GET', '/api/matches', undefined, status ? { status } : undefined);
  }

  async createMatch(projectId: string, receiverId: string, message?: string) {
    return this.request<any>('POST', '/api/matches', { projectId, receiverId, message });
  }

  async updateMatchStatus(matchId: string, status: string) {
    return this.request<any>('PATCH', `/api/matches/${matchId}/status`, { status });
  }

  async getRecommendations(projectId: string) {
    return this.request<any>('GET', `/api/matches/recommendations/${projectId}`);
  }

  // ===================== Messages =====================

  async getConversations() {
    return this.request<any>('GET', '/api/messages/conversations');
  }

  async getConversation(userId: string, params?: Record<string, string>) {
    return this.request<any>('GET', `/api/messages/${userId}`, undefined, params);
  }

  async sendMessage(receiverId: string, content: string, projectId?: string) {
    return this.request<any>('POST', '/api/messages', { receiverId, content, projectId });
  }

  async getUnreadCount() {
    return this.request<any>('GET', '/api/messages/unread/count');
  }

  // ===================== Reviews =====================

  async createReview(reviewedUserId: string, projectId: string, rating: number, content?: string) {
    return this.request<any>('POST', '/api/reviews', { reviewedUserId, projectId, rating, content });
  }

  async getUserReviews(userId: string) {
    return this.request<any>('GET', `/api/reviews/user/${userId}`);
  }

  // ===================== Skills & Resources =====================

  async getSkills(params?: Record<string, string>) {
    return this.request<any>('GET', '/api/skills', undefined, params);
  }

  async createSkill(name: string, description?: string, category?: string) {
    return this.request<any>('POST', '/api/skills', { name, description, category });
  }

  async getResources(params?: Record<string, string>) {
    return this.request<any>('GET', '/api/resources', undefined, params);
  }

  async createResource(name: string, description?: string, resourceType?: string) {
    return this.request<any>('POST', '/api/resources', { name, description, resourceType });
  }
}

export const api = new ApiClient(API_URL);
