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

// Mock data store for development
let accessRequests: AccessRequest[] = [
  {
    _id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    subject: 'Request for Professional Access',
    message: 'I would like to request professional access to collaborate on web development projects.',
    requestType: 'access_request',
    accessLevel: 'professional',
    status: 'pending',
    submittedAt: new Date('2024-01-15T10:30:00'),
  },
  {
    _id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    subject: 'Personal Portfolio Access',
    message: 'I am interested in personal access to view your portfolio and blog content.',
    requestType: 'access_request',
    accessLevel: 'personal',
    status: 'approved',
    submittedAt: new Date('2024-01-14T15:45:00'),
    processedAt: new Date('2024-01-14T16:00:00'),
    processedBy: 'admin@example.com',
    adminNotes: 'Approved for personal access',
  },
];

let userRoles: UserRole[] = [
  {
    _id: '1',
    userId: 'user-sarah-j',
    email: 'sarah.j@example.com',
    role: 'user',
    accessLevel: 'personal',
    grantedBy: 'admin@example.com',
    grantedAt: new Date('2024-01-14T16:00:00'),
    isActive: true,
  },
];

export const AccessRequestService = {
  // Get all access requests
  async getAll(): Promise<AccessRequest[]> {
    return [...accessRequests].sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  },

  // Get access request by ID
  async getById(id: string): Promise<AccessRequest | null> {
    return accessRequests.find(req => req._id === id) || null;
  },

  // Create new access request
  async create(data: AccessRequestFormData): Promise<AccessRequest> {
    const newRequest: AccessRequest = {
      _id: Date.now().toString(),
      ...data,
      status: 'pending',
      submittedAt: new Date(),
    };
    accessRequests.push(newRequest);
    return newRequest;
  },

  // Update access request status
  async updateStatus(
    id: string,
    status: 'approved' | 'rejected',
    processedBy: string,
    adminNotes?: string
  ): Promise<AccessRequest | null> {
    const requestIndex = accessRequests.findIndex(req => req._id === id);
    if (requestIndex === -1) return null;

    accessRequests[requestIndex] = {
      ...accessRequests[requestIndex],
      status,
      processedAt: new Date(),
      processedBy,
      adminNotes,
    };

    return accessRequests[requestIndex];
  },

  // Get requests by status
  async getByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<AccessRequest[]> {
    return accessRequests.filter(req => req.status === status);
  },

  // Get pending requests count
  async getPendingCount(): Promise<number> {
    return accessRequests.filter(req => req.status === 'pending').length;
  },
};

export const UserRoleService = {
  // Get all user roles
  async getAll(): Promise<UserRole[]> {
    return [...userRoles];
  },

  // Create user role from approved access request
  async createFromAccessRequest(request: AccessRequest, grantedBy: string): Promise<UserRole> {
    const newRole: UserRole = {
      _id: Date.now().toString(),
      userId: `user-${request.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '-')}`,
      email: request.email,
      role: 'user',
      accessLevel: request.accessLevel || 'personal',
      grantedBy,
      grantedAt: new Date(),
      isActive: true,
    };
    userRoles.push(newRole);
    return newRole;
  },

  // Update user role
  async update(id: string, updates: Partial<UserRole>): Promise<UserRole | null> {
    const roleIndex = userRoles.findIndex(role => role._id === id);
    if (roleIndex === -1) return null;

    userRoles[roleIndex] = {
      ...userRoles[roleIndex],
      ...updates,
    };

    return userRoles[roleIndex];
  },

  // Deactivate user role
  async deactivate(id: string): Promise<boolean> {
    const roleIndex = userRoles.findIndex(role => role._id === id);
    if (roleIndex === -1) return false;

    userRoles[roleIndex].isActive = false;
    return true;
  },
}; 