# Content Permissions System

## Overview

The Content Permissions System provides fine-grained access control for blog posts and projects with three permission levels: **Personal**, **Professional**, and **All**. This system allows content creators to control who can access their content based on user roles, specific users, and custom rules.

## Permission Levels

### 1. Personal Content
- **Access**: Highest restriction level
- **Default Roles**: Admin, Editor
- **Use Case**: Private content, personal thoughts, internal documentation
- **Authentication**: Required
- **Example**: Personal diary entries, internal company notes

### 2. Professional Content
- **Access**: Medium restriction level
- **Default Roles**: Admin, Editor, Author
- **Use Case**: Professional articles, client work, portfolio pieces
- **Authentication**: Required
- **Example**: Client case studies, professional tutorials

### 3. All (Public) Content
- **Access**: Lowest restriction level
- **Default Roles**: Admin, Editor, Author, Subscriber, Guest
- **Use Case**: Public content, marketing materials, general information
- **Authentication**: Optional
- **Example**: Public blog posts, open-source projects

## User Roles

### Role Hierarchy (from highest to lowest access)
1. **Admin**: Full system access, can manage all content and users
2. **Editor**: Can manage content, moderate posts and projects
3. **Author**: Can create and edit their own content
4. **Subscriber**: Registered user with read access
5. **Guest**: Anonymous visitor with limited access

### Access Level Assignment
- **Admin**: Personal access (can see all content)
- **Editor**: Professional access (can see professional and public content)
- **Author**: Professional access (can see professional and public content)
- **Subscriber**: All access (can see public content only)
- **Guest**: All access (can see public content only)

## Features

### Basic Permissions
- **Permission Level**: Set content visibility (Personal/Professional/All)
- **Authentication Requirement**: Toggle whether login is required
- **Role-based Access**: Select which user roles can access content
- **Template System**: Quick setup with predefined permission templates

### Advanced Permissions
- **Specific User Access**: Grant access to individual users by email
- **User Restrictions**: Explicitly deny access to specific users
- **Override System**: Specific permissions override role-based permissions

### Custom Rules
- **Rule-based Logic**: Create complex permission rules
- **Condition Types**: Role, User, Date/Time, Custom conditions
- **Operators**: Equals, Not Equals, In List, Before/After dates, etc.
- **Priority System**: Higher priority rules are evaluated first
- **Actions**: Allow or Deny access

## Implementation

### Database Schema

#### Posts and Projects
```typescript
interface ContentPermissions {
  level: 'personal' | 'professional' | 'all';
  allowedRoles: UserRole[];
  allowedUsers: string[];
  restrictedUsers: string[];
  requiresAuth: boolean;
  customRules?: PermissionRule[];
}
```

#### Users
```typescript
interface User {
  role: 'admin' | 'editor' | 'author' | 'subscriber' | 'guest';
  accessLevel: 'personal' | 'professional' | 'all';
  permissions: string[];
  isActive: boolean;
}
```

### Permission Checking Logic

1. **Custom Rules**: Evaluated first by priority
2. **Explicit Restrictions**: Check if user is specifically denied
3. **Explicit Permissions**: Check if user is specifically allowed
4. **Authentication**: Verify if login is required
5. **Role Permissions**: Check if user's role is allowed
6. **Access Level**: Verify user's access level meets requirements

### API Endpoints

#### Check Permissions
```
POST /api/permissions/check
{
  "permissions": ContentPermissions,
  "contentId": "string",
  "contentType": "post" | "project"
}
```

#### Get Default Permissions
```
GET /api/permissions/check?contentType=post&level=professional
```

## Usage Examples

### 1. Public Blog Post
```typescript
const permissions: ContentPermissions = {
  level: 'all',
  allowedRoles: ['admin', 'editor', 'author', 'subscriber', 'guest'],
  allowedUsers: [],
  restrictedUsers: [],
  requiresAuth: false,
  customRules: []
};
```

### 2. Professional Portfolio Project
```typescript
const permissions: ContentPermissions = {
  level: 'professional',
  allowedRoles: ['admin', 'editor', 'author'],
  allowedUsers: ['client@company.com'],
  restrictedUsers: [],
  requiresAuth: true,
  customRules: []
};
```

### 3. Personal Content with Time-based Access
```typescript
const permissions: ContentPermissions = {
  level: 'personal',
  allowedRoles: ['admin', 'editor'],
  allowedUsers: [],
  restrictedUsers: [],
  requiresAuth: true,
  customRules: [{
    id: 'time-restriction',
    name: 'Business Hours Only',
    description: 'Only accessible during business hours',
    condition: {
      type: 'date',
      operator: 'between',
      value: ['09:00', '17:00']
    },
    action: 'allow',
    priority: 1
  }]
};
```

### 4. Client-Specific Project
```typescript
const permissions: ContentPermissions = {
  level: 'professional',
  allowedRoles: ['admin'],
  allowedUsers: [
    'client@company.com',
    'project-manager@company.com'
  ],
  restrictedUsers: [],
  requiresAuth: true,
  customRules: [{
    id: 'client-only',
    name: 'Client Access Only',
    description: 'Only specific client can access',
    condition: {
      type: 'user',
      operator: 'in',
      value: ['client@company.com', 'project-manager@company.com']
    },
    action: 'allow',
    priority: 10
  }]
};
```

## Admin Interface

### Permissions Editor Component
- **Tabbed Interface**: Basic Settings, Advanced, Custom Rules
- **Template Selector**: Quick setup with predefined templates
- **Validation**: Real-time validation of permission configuration
- **Visual Feedback**: Icons and colors to indicate permission levels

### Permission Templates
1. **Public Access**: Everyone can access
2. **Authenticated Users**: Login required
3. **Professional Content**: Professional access level required
4. **Personal Content**: Personal access level required
5. **Admin Only**: Administrators only

## Security Considerations

### Best Practices
1. **Principle of Least Privilege**: Grant minimum necessary access
2. **Regular Audits**: Review and update permissions regularly
3. **Explicit Denials**: Use restricted users for security-sensitive content
4. **Authentication**: Always require auth for sensitive content
5. **Custom Rules**: Use sparingly and document thoroughly

### Validation
- Permission configurations are validated before saving
- Invalid rules are flagged with error messages
- Role and access level combinations are checked for consistency

## Migration Guide

### Existing Content
1. All existing posts and projects get default "All" level permissions
2. Published content remains publicly accessible
3. Unpublished content gets "Professional" level by default

### User Accounts
1. Existing users get appropriate access levels based on their roles
2. Admin users get "Personal" access level
3. Regular users get "All" access level

## Performance Considerations

### Database Indexes
- Indexed on permission level and allowed roles
- Efficient querying for content filtering
- Optimized for permission checking operations

### Caching
- Permission check results can be cached
- User context is cached per session
- Template configurations are cached

## Future Enhancements

### Planned Features
1. **Group Permissions**: Assign permissions to user groups
2. **Time-based Rules**: More sophisticated time-based access
3. **IP-based Restrictions**: Location-based access control
4. **Content Scheduling**: Automatic permission changes over time
5. **Audit Logging**: Track permission changes and access attempts

### API Extensions
1. **Bulk Permission Updates**: Update multiple content items
2. **Permission Analytics**: Track access patterns
3. **Permission Inheritance**: Hierarchical permission structures
4. **External Integration**: SSO and external auth providers

## Troubleshooting

### Common Issues
1. **Access Denied**: Check user role and access level
2. **Custom Rules Not Working**: Verify rule syntax and priority
3. **Template Not Applying**: Ensure template ID is correct
4. **Performance Issues**: Review custom rule complexity

### Debug Tools
- Permission check API for testing
- Validation errors in admin interface
- Console logging for permission decisions
- User context inspection tools

---

This permission system provides a flexible and secure way to control access to your content while maintaining ease of use for content creators and administrators.