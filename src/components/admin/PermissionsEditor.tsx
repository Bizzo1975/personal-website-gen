'use client';

import React, { useState, useEffect } from 'react';
import { 
  ContentPermissions, 
  PermissionLevel, 
  UserRole, 
  PermissionRule,
  DEFAULT_PERMISSION_TEMPLATES,
  PermissionTemplate
} from '@/types/content/permissions';
import Button from '@/components/Button';
import { 
  PlusIcon, 
  TrashIcon, 
  InformationCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
  UserGroupIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

// Client-side utility functions to replace server-side PermissionService
const validatePermissions = (permissions: ContentPermissions): string[] => {
  const errors: string[] = [];
  
  if (!permissions.level) {
    errors.push('Permission level is required');
  }
  
  if (!permissions.allowedRoles || permissions.allowedRoles.length === 0) {
    errors.push('At least one role must be allowed');
  }
  
  if (permissions.level === 'personal' && !permissions.requiresAuth) {
    errors.push('Personal content must require authentication');
  }
  
  return errors;
};

const createPermissionsFromTemplate = (templateId: string): ContentPermissions => {
  const template = DEFAULT_PERMISSION_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    return {
      level: 'all',
      allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
      allowedUsers: [],
      restrictedUsers: [],
      requiresAuth: false
    };
  }
  
  return {
    level: template.level,
    allowedRoles: template.defaultRoles,
    allowedUsers: [],
    restrictedUsers: [],
    requiresAuth: template.requiresAuth
  };
};

const getPermissionSummary = (permissions: ContentPermissions): string => {
  const { level, allowedRoles, requiresAuth } = permissions;
  
  if (level === 'all' && !requiresAuth) {
    return 'Public (Everyone)';
  }
  
  if (level === 'all' && requiresAuth) {
    return 'Authenticated Users';
  }
  
  if (level === 'professional') {
    return 'Professional Access';
  }
  
  if (level === 'personal') {
    return 'Personal Access';
  }
  
  return `${allowedRoles.length} Role(s)`;
};

interface PermissionsEditorProps {
  permissions: ContentPermissions;
  onChange: (permissions: ContentPermissions) => void;
  contentType?: 'post' | 'project';
  className?: string;
}

const PermissionsEditor: React.FC<PermissionsEditorProps> = ({
  permissions,
  onChange,
  contentType = 'post',
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'rules'>('basic');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validate permissions whenever they change
  useEffect(() => {
    const errors = validatePermissions(permissions);
    setValidationErrors(errors);
  }, [permissions]);

  const handleLevelChange = (level: PermissionLevel) => {
    const updatedPermissions = { ...permissions, level };
    
    // Auto-adjust roles based on level
    if (level === 'personal') {
      updatedPermissions.allowedRoles = ['admin', 'editor'];
      updatedPermissions.requiresAuth = true;
    } else if (level === 'professional') {
      updatedPermissions.allowedRoles = ['admin', 'editor', 'author'];
      updatedPermissions.requiresAuth = true;
    } else {
      updatedPermissions.allowedRoles = ['admin', 'editor', 'author', 'subscriber', 'guest'];
      updatedPermissions.requiresAuth = false;
    }
    
    onChange(updatedPermissions);
  };

  const handleRoleToggle = (role: UserRole) => {
    const updatedRoles = permissions.allowedRoles.includes(role)
      ? permissions.allowedRoles.filter(r => r !== role)
      : [...permissions.allowedRoles, role];
    
    onChange({ ...permissions, allowedRoles: updatedRoles });
  };

  const handleUserAdd = (type: 'allowed' | 'restricted', email: string) => {
    if (!email.trim()) return;
    
    const field = type === 'allowed' ? 'allowedUsers' : 'restrictedUsers';
    const updatedUsers = [...permissions[field], email.trim()];
    
    onChange({ ...permissions, [field]: updatedUsers });
  };

  const handleUserRemove = (type: 'allowed' | 'restricted', index: number) => {
    const field = type === 'allowed' ? 'allowedUsers' : 'restrictedUsers';
    const updatedUsers = permissions[field].filter((_, i) => i !== index);
    
    onChange({ ...permissions, [field]: updatedUsers });
  };

  const handleRuleAdd = () => {
    const newRule: PermissionRule = {
      id: `rule-${Date.now()}`,
      name: 'New Rule',
      description: '',
      condition: {
        type: 'role',
        operator: 'equals',
        value: 'admin'
      },
      action: 'allow',
      priority: 0
    };

    const updatedRules = [...(permissions.customRules || []), newRule];
    onChange({ ...permissions, customRules: updatedRules });
  };

  const handleRuleUpdate = (index: number, rule: PermissionRule) => {
    const updatedRules = [...(permissions.customRules || [])];
    updatedRules[index] = rule;
    onChange({ ...permissions, customRules: updatedRules });
  };

  const handleRuleRemove = (index: number) => {
    const updatedRules = (permissions.customRules || []).filter((_, i) => i !== index);
    onChange({ ...permissions, customRules: updatedRules });
  };

  const applyTemplate = (template: PermissionTemplate) => {
    const newPermissions = createPermissionsFromTemplate(template.id);
    onChange(newPermissions);
    setShowTemplateSelector(false);
  };

  const getPermissionIcon = (level: PermissionLevel) => {
    switch (level) {
      case 'personal': return <LockClosedIcon className="h-5 w-5 text-red-500" />;
      case 'professional': return <LockOpenIcon className="h-5 w-5 text-yellow-500" />;
      case 'all': return <UserGroupIcon className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getPermissionIcon(permissions.level)}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Content Permissions
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateSelector(!showTemplateSelector)}
            >
              Use Template
            </Button>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {getPermissionSummary(permissions)}
            </div>
          </div>
        </div>

        {/* Template Selector */}
        {showTemplateSelector && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Permission Templates
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {DEFAULT_PERMISSION_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="p-2 text-left bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {template.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-center space-x-2">
              <InformationCircleIcon className="h-5 w-5 text-red-500" />
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Permission Errors
              </h4>
            </div>
            <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-4">
          {[
            { id: 'basic', label: 'Basic Settings', icon: LockClosedIcon },
            { id: 'advanced', label: 'Advanced', icon: UserIcon },
            { id: 'rules', label: 'Custom Rules', icon: ClockIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'basic' && (
          <BasicPermissionsTab
            permissions={permissions}
            onLevelChange={handleLevelChange}
            onRoleToggle={handleRoleToggle}
            onAuthToggle={(requiresAuth) => onChange({ ...permissions, requiresAuth })}
          />
        )}

        {activeTab === 'advanced' && (
          <AdvancedPermissionsTab
            permissions={permissions}
            onUserAdd={handleUserAdd}
            onUserRemove={handleUserRemove}
          />
        )}

        {activeTab === 'rules' && (
          <CustomRulesTab
            rules={permissions.customRules || []}
            onRuleAdd={handleRuleAdd}
            onRuleUpdate={handleRuleUpdate}
            onRuleRemove={handleRuleRemove}
          />
        )}
      </div>
    </div>
  );
};

// Basic Permissions Tab Component
const BasicPermissionsTab: React.FC<{
  permissions: ContentPermissions;
  onLevelChange: (level: PermissionLevel) => void;
  onRoleToggle: (role: UserRole) => void;
  onAuthToggle: (requiresAuth: boolean) => void;
}> = ({ permissions, onLevelChange, onRoleToggle, onAuthToggle }) => {
  const levels: { value: PermissionLevel; label: string; description: string; color: string }[] = [
    {
      value: 'all',
      label: 'Public Access',
      description: 'Accessible to everyone, including anonymous users',
      color: 'green'
    },
    {
      value: 'professional',
      label: 'Professional Content',
      description: 'Accessible to users with professional access level',
      color: 'yellow'
    },
    {
      value: 'personal',
      label: 'Personal Content',
      description: 'Accessible to users with personal access level',
      color: 'red'
    }
  ];

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'editor', label: 'Editor', description: 'Can manage content' },
    { value: 'author', label: 'Author', description: 'Can create content' },
    { value: 'subscriber', label: 'Subscriber', description: 'Registered user' },
    { value: 'guest', label: 'Guest', description: 'Anonymous visitor' }
  ];

  return (
    <div className="space-y-6">
      {/* Permission Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Permission Level
        </label>
        <div className="space-y-2">
          {levels.map(level => (
            <label key={level.value} className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="permissionLevel"
                value={level.value}
                checked={permissions.level === level.value}
                onChange={() => onLevelChange(level.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {level.label}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full bg-${level.color}-100 text-${level.color}-800 dark:bg-${level.color}-900 dark:text-${level.color}-200`}>
                    {level.value}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {level.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Authentication Requirement */}
      <div>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={permissions.requiresAuth}
            onChange={(e) => onAuthToggle(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="font-medium text-gray-900 dark:text-white">
              Require Authentication
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Users must be logged in to access this content
            </p>
          </div>
        </label>
      </div>

      {/* Allowed Roles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Allowed User Roles
        </label>
        <div className="space-y-2">
          {roles.map(role => (
            <label key={role.value} className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={permissions.allowedRoles.includes(role.value)}
                onChange={() => onRoleToggle(role.value)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">
                  {role.label}
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {role.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// Advanced Permissions Tab Component
const AdvancedPermissionsTab: React.FC<{
  permissions: ContentPermissions;
  onUserAdd: (type: 'allowed' | 'restricted', email: string) => void;
  onUserRemove: (type: 'allowed' | 'restricted', index: number) => void;
}> = ({ permissions, onUserAdd, onUserRemove }) => {
  const [allowedUserInput, setAllowedUserInput] = useState('');
  const [restrictedUserInput, setRestrictedUserInput] = useState('');

  return (
    <div className="space-y-6">
      {/* Allowed Users */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Specifically Allowed Users
        </label>
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="email"
              value={allowedUserInput}
              onChange={(e) => setAllowedUserInput(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onUserAdd('allowed', allowedUserInput);
                  setAllowedUserInput('');
                }
              }}
            />
            <Button
              onClick={() => {
                onUserAdd('allowed', allowedUserInput);
                setAllowedUserInput('');
              }}
              disabled={!allowedUserInput.trim()}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          {permissions.allowedUsers.length > 0 && (
            <div className="space-y-1">
              {permissions.allowedUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <span className="text-sm text-green-800 dark:text-green-200">{user}</span>
                  <button
                    onClick={() => onUserRemove('allowed', index)}
                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Restricted Users */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Restricted Users
        </label>
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="email"
              value={restrictedUserInput}
              onChange={(e) => setRestrictedUserInput(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onUserAdd('restricted', restrictedUserInput);
                  setRestrictedUserInput('');
                }
              }}
            />
            <Button
              onClick={() => {
                onUserAdd('restricted', restrictedUserInput);
                setRestrictedUserInput('');
              }}
              disabled={!restrictedUserInput.trim()}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          {permissions.restrictedUsers.length > 0 && (
            <div className="space-y-1">
              {permissions.restrictedUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                  <span className="text-sm text-red-800 dark:text-red-200">{user}</span>
                  <button
                    onClick={() => onUserRemove('restricted', index)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom Rules Tab Component
const CustomRulesTab: React.FC<{
  rules: PermissionRule[];
  onRuleAdd: () => void;
  onRuleUpdate: (index: number, rule: PermissionRule) => void;
  onRuleRemove: (index: number) => void;
}> = ({ rules, onRuleAdd, onRuleUpdate, onRuleRemove }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Custom Permission Rules
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create advanced rules for fine-grained access control
          </p>
        </div>
        <Button onClick={onRuleAdd}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <ClockIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No custom rules defined</p>
          <p className="text-sm">Click "Add Rule" to create your first custom permission rule</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <CustomRuleEditor
              key={rule.id}
              rule={rule}
              onUpdate={(updatedRule) => onRuleUpdate(index, updatedRule)}
              onRemove={() => onRuleRemove(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Custom Rule Editor Component
const CustomRuleEditor: React.FC<{
  rule: PermissionRule;
  onUpdate: (rule: PermissionRule) => void;
  onRemove: () => void;
}> = ({ rule, onUpdate, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const conditionTypes = [
    { value: 'role', label: 'User Role' },
    { value: 'user', label: 'Specific User' },
    { value: 'date', label: 'Date/Time' },
    { value: 'custom', label: 'Custom' }
  ];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'in', label: 'In List' },
    { value: 'not_in', label: 'Not In List' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' }
  ];

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white">
                {rule.name}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {rule.action === 'allow' ? 'Allow' : 'Deny'} • Priority: {rule.priority}
              </p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rule Name
              </label>
              <input
                type="text"
                value={rule.name}
                onChange={(e) => onUpdate({ ...rule, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Action
              </label>
              <select
                value={rule.action}
                onChange={(e) => onUpdate({ ...rule, action: e.target.value as 'allow' | 'deny' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="allow">Allow</option>
                <option value="deny">Deny</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={rule.description}
              onChange={(e) => onUpdate({ ...rule, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Condition Type
              </label>
              <select
                value={rule.condition.type}
                onChange={(e) => onUpdate({
                  ...rule,
                  condition: { ...rule.condition, type: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {conditionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Operator
              </label>
              <select
                value={rule.condition.operator}
                onChange={(e) => onUpdate({
                  ...rule,
                  condition: { ...rule.condition, operator: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <input
                type="number"
                value={rule.priority}
                onChange={(e) => onUpdate({ ...rule, priority: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value
            </label>
            <input
              type="text"
              value={typeof rule.condition.value === 'string' ? rule.condition.value : JSON.stringify(rule.condition.value)}
              onChange={(e) => {
                let value: any = e.target.value;
                try {
                  // Try to parse as JSON for arrays/objects
                  if (value.startsWith('[') || value.startsWith('{')) {
                    value = JSON.parse(value);
                  }
                } catch {
                  // Keep as string if not valid JSON
                }
                onUpdate({
                  ...rule,
                  condition: { ...rule.condition, value }
                });
              }}
              placeholder="Enter value (use JSON format for arrays/objects)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsEditor;
