/**
 * Field Validation Utilities
 * Comprehensive regex and validation rules for workflow fields
 */

export interface ValidationResult {
  isValid: boolean
  errorMessage?: string
}

/**
 * Validation regex patterns
 */
export const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  phone: /^\+?[1-9]\d{1,14}$/, // E.164 format
  date: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
  time: /^([01]\d|2[0-3]):([0-5]\d)$/, // HH:MM
  postalCode: /^[A-Z0-9\s-]{3,10}$/i,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+(\.\d+)?$/,
  currency: /^\d+(\.\d{1,2})?$/,
  percentage: /^(100|[0-9]{1,2})(\.\d{1,2})?%?$/,
  taxId: /^[A-Z0-9-]{8,20}$/i,
  companyCode: /^[A-Z0-9-]{3,20}$/i,
}

/**
 * Validate field value based on field type and validation rules
 */
export function validateField(
  fieldType: string,
  value: any,
  validationRules?: {
    min?: number
    max?: number
    min_length?: number
    max_length?: number
    pattern?: string
    required?: boolean
    options?: string[]
  }
): ValidationResult {
  // Handle required fields
  if (validationRules?.required) {
    if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
      return {
        isValid: false,
        errorMessage: "This field is required",
      }
    }
  }

  // Skip validation if value is empty and not required
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return { isValid: true }
  }

  const stringValue = String(value).trim()

  // Type-specific validation
  switch (fieldType) {
    case "email":
      if (!VALIDATION_PATTERNS.email.test(stringValue)) {
        return {
          isValid: false,
          errorMessage: "Invalid email format",
        }
      }
      break

    case "url":
      if (!VALIDATION_PATTERNS.url.test(stringValue)) {
        return {
          isValid: false,
          errorMessage: "Invalid URL format (must start with http:// or https://)",
        }
      }
      break

    case "phone":
      // Remove spaces, dashes, and parentheses for validation
      const cleanPhone = stringValue.replace(/[\s\-\(\)]/g, "")
      if (!VALIDATION_PATTERNS.phone.test(cleanPhone)) {
        return {
          isValid: false,
          errorMessage: "Invalid phone format (use E.164 format, e.g., +1234567890)",
        }
      }
      break

    case "date":
      if (!VALIDATION_PATTERNS.date.test(stringValue)) {
        return {
          isValid: false,
          errorMessage: "Invalid date format (use YYYY-MM-DD)",
        }
      }
      // Validate date is not in the future (if needed)
      const dateValue = new Date(stringValue)
      if (isNaN(dateValue.getTime())) {
        return {
          isValid: false,
          errorMessage: "Invalid date",
        }
      }
      break

    case "number":
      if (!VALIDATION_PATTERNS.numeric.test(stringValue)) {
        return {
          isValid: false,
          errorMessage: "Must be a valid number",
        }
      }
      const numValue = parseFloat(stringValue)
      if (validationRules?.min !== undefined && numValue < validationRules.min) {
        return {
          isValid: false,
          errorMessage: `Minimum value is ${validationRules.min}`,
        }
      }
      if (validationRules?.max !== undefined && numValue > validationRules.max) {
        return {
          isValid: false,
          errorMessage: `Maximum value is ${validationRules.max}`,
        }
      }
      break

    case "text":
    case "textarea":
      if (validationRules?.min_length && stringValue.length < validationRules.min_length) {
        return {
          isValid: false,
          errorMessage: `Minimum ${validationRules.min_length} characters required`,
        }
      }
      if (validationRules?.max_length && stringValue.length > validationRules.max_length) {
        return {
          isValid: false,
          errorMessage: `Maximum ${validationRules.max_length} characters allowed`,
        }
      }
      if (validationRules?.pattern) {
        try {
          const regex = new RegExp(validationRules.pattern)
          if (!regex.test(stringValue)) {
            return {
              isValid: false,
              errorMessage: "Value does not match required pattern",
            }
          }
        } catch (e) {
          console.error("Invalid regex pattern:", validationRules.pattern)
        }
      }
      break

    case "select":
      if (validationRules?.options && !validationRules.options.includes(stringValue)) {
        return {
          isValid: false,
          errorMessage: `Value must be one of: ${validationRules.options.join(", ")}`,
        }
      }
      break

    case "checkbox":
      if (typeof value !== "boolean") {
        return {
          isValid: false,
          errorMessage: "Must be true or false",
        }
      }
      break

    default:
      // For unknown types, just check length if specified
      if (validationRules?.min_length && stringValue.length < validationRules.min_length) {
        return {
          isValid: false,
          errorMessage: `Minimum ${validationRules.min_length} characters required`,
        }
      }
      if (validationRules?.max_length && stringValue.length > validationRules.max_length) {
        return {
          isValid: false,
          errorMessage: `Maximum ${validationRules.max_length} characters allowed`,
        }
      }
  }

  return { isValid: true }
}

/**
 * Validate all fields in a step
 */
export function validateStep(
  fields: Array<{
    id: string
    type: string
    label: string
    required?: boolean
    validation?: any
    options?: string[]
  }>,
  formData: Record<string, any>
): Record<string, string> {
  const errors: Record<string, string> = {}

  fields.forEach((field) => {
    const value = formData[field.id]
    const validationRules = {
      required: field.required,
      ...field.validation,
      options: field.options,
    }

    const result = validateField(field.type, value, validationRules)
    if (!result.isValid && result.errorMessage) {
      errors[field.id] = result.errorMessage
    }
  })

  return errors
}

