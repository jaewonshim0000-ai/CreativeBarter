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

  async bulkSaveSkills(skills: { name: string; proficiency_estimate: number; category: string }[]) {
    return this.request<any>('POST', '/api/users/me/skills/bulk', { skills });
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

  async analyzeText(text: string) {
    return this.request<any>('POST', '/api/matches/analyze', { text });
  }

  async analyzePortfolio(urls: string[], bio: string, existingSkills: string[] = []) {
    return this.request<any>('POST', '/api/matches/analyze-portfolio', { urls, bio, existingSkills });
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

  async getMyReviews() {
    return this.request<any>('GET', '/api/reviews/by-me');
  }

  async getReviewableMatches() {
    return this.request<any>('GET', '/api/reviews/reviewable');
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

  // ===================== Circular Barter Chains =====================

  async getMyWants() {
    return this.request<any>('GET', '/api/barter-chains/wants');
  }

  async addWant(skillName: string, description?: string, priority: number = 5) {
    return this.request<any>('POST', '/api/barter-chains/wants', { skillName, description, priority });
  }

  async removeWant(skillName: string) {
    return this.request<any>('DELETE', `/api/barter-chains/wants/${encodeURIComponent(skillName)}`);
  }

  async discoverCircularBarters(maxLength: number = 5, maxResults: number = 10) {
    return this.request<any>('GET', '/api/barter-chains/discover', undefined, {
      maxLength: maxLength.toString(), maxResults: maxResults.toString(),
    });
  }

  async getMyBarterChains(status?: string) {
    return this.request<any>('GET', '/api/barter-chains', undefined, status ? { status } : undefined);
  }

  async getBarterChain(id: string) {
    return this.request<any>('GET', `/api/barter-chains/${id}`);
  }

  async createBarterChain(data: any) {
    return this.request<any>('POST', '/api/barter-chains', data);
  }

  async respondToBarterChain(chainId: string, accept: boolean) {
    return this.request<any>('POST', `/api/barter-chains/${chainId}/respond`, { accept });
  }

  async completeBarterChain(chainId: string) {
    return this.request<any>('POST', `/api/barter-chains/${chainId}/complete`);
  }

  // ===================== Trade Credits =====================

  async getWallet() {
    return this.request<any>('GET', '/api/credits/wallet');
  }

  async proposeOffer(matchId: string, amount: number, payerId: string, payeeId: string, note?: string) {
    return this.request<any>('POST', '/api/credits/offers', { matchId, amount, payerId, payeeId, note });
  }

  async counterOffer(offerId: string, counterAmount: number, counterNote?: string, payerId?: string, payeeId?: string) {
    return this.request<any>('POST', `/api/credits/offers/${offerId}/counter`, { counterAmount, counterNote, payerId, payeeId });
  }

  async acceptOffer(offerId: string) {
    return this.request<any>('POST', `/api/credits/offers/${offerId}/accept`);
  }

  async rejectOffer(offerId: string) {
    return this.request<any>('POST', `/api/credits/offers/${offerId}/reject`);
  }

  async getMatchOffers(matchId: string) {
    return this.request<any>('GET', `/api/credits/offers/match/${matchId}`);
  }

  async getActiveOffer(matchId: string) {
    return this.request<any>('GET', `/api/credits/offers/match/${matchId}/active`);
  }

  // ===================== Community (Public) =====================

  async getCommunityMapUsers() {
    return this.request<any>('GET', '/api/community/map');
  }

  async getCommunityStats() {
    return this.request<any>('GET', '/api/community/stats');
  }
}

export const api = new ApiClient(API_URL);
