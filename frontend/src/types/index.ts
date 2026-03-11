// ============================================================
// Shared TypeScript types for the Creative Barter Network frontend
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
  bio?: string;
  specialty: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  role: string;
  portfolio: PortfolioItem[];
  avgRating: number;
  totalReviews: number;
  skills?: UserSkill[];
  resources?: UserResource[];
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioItem {
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  link?: string;
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience: number;
  skill: Skill;
}

export interface Resource {
  id: string;
  name: string;
  description?: string;
  resourceType?: string;
}

export interface UserResource {
  id: string;
  userId: string;
  resourceId: string;
  details?: string;
  availability: 'available' | 'limited' | 'unavailable';
  resource: Resource;
}

export interface Project {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  requiredSkills: { name: string; proficiency?: string }[];
  requiredResources: { name: string; type?: string }[];
  offeredSkills: { name: string; proficiency?: string }[];
  offeredResources: { name: string; type?: string }[];
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  deadline?: string;
  maxCollaborators: number;
  tags: string[];
  creator?: Partial<User>;
  _count?: { matches: number };
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  projectId: string;
  proposerId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
  matchScore?: number;
  project?: Partial<Project>;
  proposer?: Partial<User>;
  receiver?: Partial<User>;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  projectId?: string;
  content: string;
  isRead: boolean;
  sender?: Partial<User>;
  createdAt: string;
}

export interface Conversation {
  partnerId: string;
  partner: Partial<User>;
  lastMessage: Message;
  project?: Partial<Project>;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewedUserId: string;
  projectId: string;
  rating: number;
  content?: string;
  reviewer?: Partial<User>;
  project?: Partial<Project>;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthResponse {
  user: Pick<User, 'id' | 'email' | 'name' | 'role'>;
  token: string;
}

// ============================================================
// Portfolio Analysis Types
// ============================================================

export interface PortfolioSkill {
  name: string;
  proficiency_estimate: number; // 1-10
  category: string; // "software" | "artistic_skill" | "tool" | "language" | "technique" | "domain"
}

export interface PortfolioAnalysisRequest {
  urls: string[];
  bio: string;
  existingSkills: string[];
}

export interface PortfolioAnalysisResponse {
  top_skills: PortfolioSkill[];
  suggested_categories: string[];
  tools_detected: string[];
  artistic_styles: string[];
  summary: string;
  urls_analyzed: string[];
  urls_failed: string[];
}
