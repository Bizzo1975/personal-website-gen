'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserIcon,
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  KeyIcon,
  EnvelopeIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/Button';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  lastLogin?: string;
  createdAt: string;
  avatar?: string;
  twoFactorEnabled: boolean;
  loginAttempts: number;
  lastLoginAttempt?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspend })
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('Password reset email sent successfully');
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
    }
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' at ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
        <Button onClick={handleCreateUser}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add User
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'users', label: 'Users', count: users.length },
            { id: 'roles', label: 'Roles', count: roles.length },
            { id: 'permissions', label: 'Permissions', count: permissions.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Users List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {getFilteredUsers().map(user => (
                <div key={user.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <UserIcon className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                          {user.twoFactorEnabled && (
                            <ShieldCheckIcon className="h-4 w-4 text-green-500" title="2FA Enabled" />
                          )}
                          {user.loginAttempts > 3 && (
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" title="Multiple failed login attempts" />
                          )}
                        </div>
                        
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{user.email}</span>
                          <span>•</span>
                          <span>{user.role}</span>
                          {user.lastLogin && (
                            <>
                              <span>•</span>
                              <span>Last login: {formatDate(user.lastLogin)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResetPassword(user.id)}
                      >
                        <KeyIcon className="h-4 w-4" />
                      </Button>

                      {user.status === 'active' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSuspendUser(user.id, true)}
                        >
                          Suspend
                        </Button>
                      ) : user.status === 'suspended' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSuspendUser(user.id, false)}
                        >
                          Activate
                        </Button>
                      ) : null}

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Roles & Permissions</h3>
            <Button onClick={() => setShowRoleModal(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Role
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => (
              <div key={role.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {role.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {role.userCount} user{role.userCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {role.isSystem && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      System
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {role.description}
                </p>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Permissions ({role.permissions.length})
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map(permission => (
                      <span
                        key={permission}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                      >
                        {permission}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedRole(role);
                      setShowRoleModal(true);
                    }}
                    disabled={role.isSystem}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Permissions</h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {Object.entries(
              permissions.reduce((acc, permission) => {
                if (!acc[permission.category]) {
                  acc[permission.category] = [];
                }
                acc[permission.category].push(permission);
                return acc;
              }, {} as Record<string, Permission[]>)
            ).map(([category, categoryPermissions]) => (
              <div key={category} className="p-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 capitalize">
                  {category} Permissions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryPermissions.map(permission => (
                    <div key={permission.id} className="flex items-start space-x-3">
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                          {permission.name}
                        </h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          roles={roles}
          onClose={() => setShowUserModal(false)}
          onSave={fetchUsers}
        />
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <RoleModal
          role={selectedRole}
          permissions={permissions}
          onClose={() => setShowRoleModal(false)}
          onSave={fetchRoles}
        />
      )}
    </div>
  );
};

// User Modal Component
const UserModal: React.FC<{
  user: User | null;
  roles: Role[];
  onClose: () => void;
  onSave: () => void;
}> = ({ user, roles, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    status: user?.status || 'active'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = user ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = user ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {user ? 'Edit User' : 'Create User'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select a role</option>
              {roles.map(role => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {user ? 'Update' : 'Create'} User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Role Modal Component
const RoleModal: React.FC<{
  role: Role | null;
  permissions: Permission[];
  onClose: () => void;
  onSave: () => void;
}> = ({ role, permissions, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = role ? `/api/admin/roles/${role.id}` : '/api/admin/roles';
      const method = role ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {role ? 'Edit Role' : 'Create Role'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permissions
            </label>
            <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3">
              {Object.entries(
                permissions.reduce((acc, permission) => {
                  if (!acc[permission.category]) {
                    acc[permission.category] = [];
                  }
                  acc[permission.category].push(permission);
                  return acc;
                }, {} as Record<string, Permission[]>)
              ).map(([category, categoryPermissions]) => (
                <div key={category} className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 capitalize">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {categoryPermissions.map(permission => (
                      <label key={permission.id} className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-1"
                        />
                        <div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {permission.name}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {permission.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {role ? 'Update' : 'Create'} Role
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement; 