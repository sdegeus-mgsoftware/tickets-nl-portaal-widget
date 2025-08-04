export function validateRequired(value) {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  return true;
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone) {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateFileSize(file, maxSize) {
  return file.size <= maxSize;
}

export function validateFileType(file, allowedTypes) {
  return allowedTypes.includes(file.type);
}

export function sanitizeInput(input) {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 1000); // Limit length
}

export function sanitizeHtml(html) {
  const tempDiv = document.createElement('div');
  tempDiv.textContent = html;
  return tempDiv.innerHTML;
}

export function validateCustomField(value, field) {
  if (field.required && !validateRequired(value)) {
    return { isValid: false, error: `${field.label} is required` };
  }
  
  if (field.type === 'email' && value && !validateEmail(value)) {
    return { isValid: false, error: `${field.label} must be a valid email` };
  }
  
  if (field.validation && value && !field.validation.test(value)) {
    return { isValid: false, error: `${field.label} format is invalid` };
  }
  
  return { isValid: true };
}