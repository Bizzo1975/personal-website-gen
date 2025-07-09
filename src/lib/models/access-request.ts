export interface AccessRequest {
  _id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  requestType: 'contact' | 'access_request';
  accessLevel?: 'personal' | 'professional';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  adminNotes?: string;
}

export interface AccessRequestFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  requestType: 'contact' | 'access_request';
  accessLevel?: 'personal' | 'professional';
}

export interface UserRole {
  _id?: string;
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  accessLevel: 'personal' | 'professional' | 'full';
  grantedBy: string;
  grantedAt: Date;
  isActive: boolean;
} 