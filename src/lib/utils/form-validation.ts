/**
 * Form Validation Utilities
 * 
 * This module provides utilities for validating form inputs
 * with proper error handling and consistent messages.
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a required field
 * @param field Field name
 * @param value Field value
 * @param label Human-readable field label
 */
export function validateRequired(
  field: string, 
  value: string | undefined | null,
  label: string = field
): ValidationError | null {
  if (!value || value.trim() === '') {
    return {
      field,
      message: `${label} is required`
    };
  }
  return null;
}

/**
 * Validates email format
 * @param field Field name
 * @param value Email value
 * @param label Human-readable field label
 */
export function validateEmail(
  field: string,
  value: string | undefined | null,
  label: string = field
): ValidationError | null {
  if (!value) return null; // If empty, rely on validateRequired
  
  // RFC 5322 email regex pattern
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailPattern.test(value)) {
    return {
      field,
      message: `Please enter a valid ${label.toLowerCase()} address`
    };
  }
  return null;
}

/**
 * Validates minimum length
 * @param field Field name
 * @param value Field value
 * @param minLength Minimum length
 * @param label Human-readable field label
 */
export function validateMinLength(
  field: string,
  value: string | undefined | null,
  minLength: number,
  label: string = field
): ValidationError | null {
  if (!value) return null; // If empty, rely on validateRequired
  
  if (value.trim().length < minLength) {
    return {
      field,
      message: `${label} must be at least ${minLength} characters`
    };
  }
  return null;
}

/**
 * Validates maximum length
 * @param field Field name
 * @param value Field value
 * @param maxLength Maximum length
 * @param label Human-readable field label
 */
export function validateMaxLength(
  field: string,
  value: string | undefined | null,
  maxLength: number,
  label: string = field
): ValidationError | null {
  if (!value) return null; // If empty, rely on validateRequired
  
  if (value.trim().length > maxLength) {
    return {
      field,
      message: `${label} cannot exceed ${maxLength} characters`
    };
  }
  return null;
}

/**
 * Validates input against a regex pattern
 * @param field Field name
 * @param value Field value
 * @param pattern Regex pattern
 * @param errorMessage Custom error message
 */
export function validatePattern(
  field: string,
  value: string | undefined | null,
  pattern: RegExp,
  errorMessage: string
): ValidationError | null {
  if (!value) return null; // If empty, rely on validateRequired
  
  if (!pattern.test(value)) {
    return {
      field,
      message: errorMessage
    };
  }
  return null;
}

/**
 * Validates that the input is free of common spam patterns
 * @param field Field name
 * @param value Field value
 * @param label Human-readable field label
 */
export function validateNoSpam(
  field: string,
  value: string | undefined | null,
  label: string = field
): ValidationError | null {
  if (!value) return null; // If empty, rely on validateRequired
  
  // Common spam patterns
  const spamPatterns = [
    /\b(viagra|cialis|levitra|pharmacy)\b/i, // Pharmaceutical spam
    /\b(casino|poker|gambling)\b/i, // Gambling spam
    /(https?:\/\/|www\.)/i, // Links (often in spam)
    /\b(sex|xxx|porn|adult)\b/i, // Adult content spam
    /\b(free|discount|cheap|offer|deal|price)\b.{0,10}\b(now|today|limited)\b/i // Marketing spam
  ];
  
  for (const pattern of spamPatterns) {
    if (pattern.test(value)) {
      return {
        field,
        message: `${label} contains content that appears to be spam`
      };
    }
  }
  
  return null;
}

/**
 * Validates all fields in a contact form
 * @param data Form data
 */
export function validateContactForm(data: {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];
  const { name, email, subject, message } = data;
  
  // Required field validation
  const requiredErrors = [
    validateRequired('name', name, 'Name'),
    validateRequired('email', email, 'Email'),
    validateRequired('subject', subject, 'Subject'),
    validateRequired('message', message, 'Message')
  ].filter(Boolean) as ValidationError[];
  
  errors.push(...requiredErrors);
  
  // If required fields are missing, don't do further validation
  if (requiredErrors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Email validation
  const emailError = validateEmail('email', email, 'Email');
  if (emailError) errors.push(emailError);
  
  // Length validations
  const nameMinError = validateMinLength('name', name, 2, 'Name');
  if (nameMinError) errors.push(nameMinError);
  
  const nameMaxError = validateMaxLength('name', name, 100, 'Name');
  if (nameMaxError) errors.push(nameMaxError);
  
  const subjectMaxError = validateMaxLength('subject', subject, 200, 'Subject');
  if (subjectMaxError) errors.push(subjectMaxError);
  
  const messageMinError = validateMinLength('message', message, 10, 'Message');
  if (messageMinError) errors.push(messageMinError);
  
  const messageMaxError = validateMaxLength('message', message, 5000, 'Message');
  if (messageMaxError) errors.push(messageMaxError);
  
  // Spam validation
  const nameSpamError = validateNoSpam('name', name, 'Name');
  if (nameSpamError) errors.push(nameSpamError);
  
  const subjectSpamError = validateNoSpam('subject', subject, 'Subject');
  if (subjectSpamError) errors.push(subjectSpamError);
  
  const messageSpamError = validateNoSpam('message', message, 'Message');
  if (messageSpamError) errors.push(messageSpamError);
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
