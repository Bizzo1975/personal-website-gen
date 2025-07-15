'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import AdminPageLayout from '@/app/admin/components/AdminPageLayout';
import Card, { CardBody, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import {
  UserIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  EnvelopeIcon,
  CalendarIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'subscriber' | 'author' | 'editor' | 'admin';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  lastLogin?: string;
  createdAt: string;
  avatar?: string;
  permissions: string[];
  accessLevels?: {
    hasProfessionalAccess: boolean;
    hasPersonalAccess: boolean;
    isActive: boolean;
    grantedAt?: string;
    grantedBy?: string;
  };
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSave: (user: Partial<User>) => void;
}

function UserModal({ isOpen, onClose, user, onSave }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'subscriber' as User['role'],
    status: 'active' as User['status'],
    permissions: [] as string[],
    hasProfessionalAccess: false,
    hasPersonalAccess: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        hasProfessionalAccess: user.accessLevels?.hasProfessionalAccess || false,
        hasPersonalAccess: user.accessLevels?.hasPersonalAccess || false
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'subscriber',
        status: 'active',
        permissions: [],
        hasProfessionalAccess: false,
        hasPersonalAccess: false
      });
    }
    setError('');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = user ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = user ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user');
      }

      onSave(data.user);
      onClose();
    } catch (error) {
      console.error('Failed to save user:', error);
      setError(error instanceof Error ? error.message : 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const availablePermissions = [
    'read_posts', 'write_posts', 'edit_posts', 'delete_posts',
    'read_pages', 'write_pages', 'edit_pages', 'delete_pages',
    'manage_media', 'manage_users', 'manage_settings', 'view_analytics',
    'contact_access', 'live_chat', 'phone_contact', 'schedule_meeting'
  ];

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password {!user && '*'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={!user}
                disabled={loading}
                placeholder={user ? 'Leave blank to keep current password' : 'Enter password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
            </div>
            {!user && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Password will be auto-generated if left blank
              </p>
            )}
          </div>

          {/* Role and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as User['role'] }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="subscriber">Subscriber</option>
                <option value="author">Author</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as User['status'] }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Access Levels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Access Levels
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="professionalAccess"
                  checked={formData.hasProfessionalAccess}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasProfessionalAccess: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="professionalAccess" className="text-sm text-gray-700 dark:text-gray-300">
                  Professional Access
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="personalAccess"
                  checked={formData.hasPersonalAccess}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasPersonalAccess: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="personalAccess" className="text-sm text-gray-700 dark:text-gray-300">
                  Personal Access
                </label>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Additional Permissions
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3">
              {availablePermissions.map(permission => (
                <label key={permission} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>{user ? 'Update User' : 'Create User'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
  onSave: (role: Partial<Role>) => void;
}

function RoleModal({ isOpen, onClose, role, onSave }: RoleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions
      });
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
        permissions: []
      });
    }
  }, [role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const availablePermissions = [
    'read_posts', 'write_posts', 'edit_posts', 'delete_posts',
    'read_pages', 'write_pages', 'edit_pages', 'delete_pages',
    'read_projects', 'write_projects', 'edit_projects', 'delete_projects',
    'manage_media', 'manage_users', 'manage_settings', 'view_analytics',
    'manage_comments', 'manage_templates', 'manage_roles', 'system_admin',
    'contact_access', 'live_chat', 'phone_contact', 'schedule_meeting'
  ];

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {role ? 'Edit Role' : 'Create New Role'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Name (Internal)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., content_manager"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Lowercase, underscores only
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Content Manager"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Describe what this role can do..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Permissions
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-3">
              {availablePermissions.map(permission => (
                <label key={permission} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {role ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserManagementPageContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        
        // Transform the API response to match the expected format
        const transformedUsers = (data.users || []).map((user: any) => ({
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          role: user.role || 'subscriber',
          status: user.status || 'active',
          lastLogin: null,
          createdAt: user.createdAt,
          avatar: null,
          permissions: user.role === 'admin' 
            ? ['system_admin', 'manage_users', 'manage_settings', 'manage_roles', 'view_analytics', 'manage_media', 'edit_posts', 'delete_posts', 'write_posts', 'read_posts']
            : user.role === 'editor'
            ? ['edit_posts', 'delete_posts', 'write_posts', 'read_posts', 'manage_media', 'manage_comments']
            : user.role === 'author'
            ? ['write_posts', 'read_posts', 'edit_posts']
            : ['read_posts'],
          accessLevels: user.accessLevels
        }));
        
        setUsers(transformedUsers);
      } else {
        console.error('Failed to fetch users:', response.status);
        showNotification('error', 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showNotification('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      } else {
        // Use default roles if API fails
        setRoles([
          {
            id: '1',
            name: 'admin',
            displayName: 'Administrator',
            description: 'Full system access with all permissions',
            permissions: ['system_admin', 'manage_users', 'manage_settings', 'manage_roles', 'view_analytics', 'manage_media', 'edit_posts', 'delete_posts', 'write_posts', 'read_posts'],
            isSystem: true,
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'editor',
            displayName: 'Editor',
            description: 'Can manage content and moderate posts',
            permissions: ['edit_posts', 'delete_posts', 'write_posts', 'read_posts', 'manage_media', 'manage_comments'],
            isSystem: true,
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '3',
            name: 'author',
            displayName: 'Author',
            description: 'Can create and edit their own content',
            permissions: ['write_posts', 'read_posts', 'edit_posts'],
            isSystem: true,
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '4',
            name: 'subscriber',
            displayName: 'Subscriber',
            description: 'Basic read-only access',
            permissions: ['read_posts'],
            isSystem: true,
            createdAt: '2024-01-01T00:00:00Z'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      await fetchUsers(); // Refresh the users list
      setEditingUser(null);
      showNotification('success', `User ${editingUser ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Failed to save user:', error);
      showNotification('error', 'Failed to save user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`Are you sure you want to delete user "${user.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchUsers();
        showNotification('success', 'User deleted successfully');
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      showNotification('error', 'Failed to delete user');
    }
  };

  const handleBulkAction = async (action: string, params?: any) => {
    if (selectedUsers.size === 0) {
      showNotification('error', 'No users selected');
      return;
    }

    const confirmMessage = action === 'delete' 
      ? `Are you sure you want to delete ${selectedUsers.size} user(s)?`
      : `Are you sure you want to ${action} ${selectedUsers.size} user(s)?`;

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userIds: Array.from(selectedUsers),
          params
        })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchUsers();
        setSelectedUsers(new Set());
        showNotification('success', data.message);
      } else {
        showNotification('error', data.error || 'Bulk operation failed');
      }
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      showNotification('error', 'Bulk operation failed');
    }
  };

  const handleSaveRole = async (roleData: Partial<Role>) => {
    try {
      const url = editingRole ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles';
      const method = editingRole ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roleData,
          isSystem: false,
          createdAt: editingRole?.createdAt || new Date().toISOString()
        })
      });

      if (response.ok) {
        await fetchRoles();
        setEditingRole(null);
        alert(`Role ${editingRole ? 'updated' : 'created'} successfully!`);
      }
    } catch (error) {
      console.error('Failed to save role:', error);
      alert('Failed to save role. Please try again.');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    if (role.isSystem) {
      alert('Cannot delete system roles.');
      return;
    }

    if (!confirm(`Are you sure you want to delete the role "${role.displayName}"?`)) return;

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchRoles();
        alert('Role deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete role:', error);
      alert('Failed to delete role. Please try again.');
    }
  };

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'editor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'author': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'suspended': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <AdminPageLayout>
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
            ))}
          </div>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          User Management
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'users'
                ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <UserGroupIcon className="h-4 w-4" />
            <span>Users ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'roles'
                ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <ShieldCheckIcon className="h-4 w-4" />
            <span>Roles ({roles.length})</span>
          </button>
        </nav>
      </div>

      {activeTab === 'users' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{users.length}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {users.filter(u => u.status === 'active').length}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <UserIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {users.filter(u => u.role === 'admin').length}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {users.filter(u => u.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="author">Author</option>
                <option value="subscriber">Subscriber</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>

              <Button
                onClick={() => {
                  setEditingUser(null);
                  setUserModalOpen(true);
                }}
                className="flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add User</span>
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedUsers.size} user(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    className="text-green-600 hover:text-green-700"
                  >
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    Deactivate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <Card>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                            } else {
                              setSelectedUsers(new Set());
                            }
                          }}
                          checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Access
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedUsers);
                              if (e.target.checked) {
                                newSelected.add(user.id);
                              } else {
                                newSelected.delete(user.id);
                              }
                              setSelectedUsers(newSelected);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-1">
                            {user.accessLevels?.hasProfessionalAccess && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                Pro
                              </span>
                            )}
                            {user.accessLevels?.hasPersonalAccess && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                Personal
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setUserModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {activeTab === 'roles' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Roles</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{roles.length}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Roles</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {roles.filter(r => r.isSystem).length}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <UserIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {roles.filter(r => r.name === 'admin').length}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {roles.filter(r => r.name === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Controls */}
          <Card className="mb-6">
            <CardBody>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setEditingRole(null);
                    setRoleModalOpen(true);
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Roles Table */}
          <Card>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(new Set(roles.map(r => r.id)));
                            } else {
                              setSelectedUsers(new Set());
                            }
                          }}
                          checked={selectedUsers.size === roles.length && roles.length > 0}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {roles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(role.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedUsers);
                              if (e.target.checked) {
                                newSelected.add(role.id);
                              } else {
                                newSelected.delete(role.id);
                              }
                              setSelectedUsers(newSelected);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {role.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {role.displayName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingRole(role);
                                setRoleModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {/* User Modal */}
      <UserModal
        isOpen={userModalOpen}
        onClose={() => {
          setUserModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={handleSaveUser}
      />

      {/* Role Modal */}
      <RoleModal
        isOpen={roleModalOpen}
        onClose={() => {
          setRoleModalOpen(false);
          setEditingRole(null);
        }}
        role={editingRole}
        onSave={handleSaveRole}
      />
    </AdminPageLayout>
  );
}

export default function UserManagementPage() {
  return (
    <AdminLayout title="User Management">
      <UserManagementPageContent />
    </AdminLayout>
  );
} 