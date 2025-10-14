import { z } from 'zod'

const phoneRegex = /^\+?91?[6-9]\d{9}$/

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

const pincodeRegex = /^[1-9][0-9]{5}$/

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

const aadharRegex = /^\d{4}\s?\d{4}\s?\d{4}$/

export const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s.]+$/, 'Name can only contain letters, spaces, and dots'),
  
  phone: z
    .string()
    .min(10, 'Phone number is required')
    .regex(phoneRegex, 'Please enter a valid Indian phone number'),
  
  role: z.enum(['farmer', 'consumer', 'supplier', 'admin'], {
    error: 'Please select a role'
  }),
  
  email: z
    .string()
    .email('Please enter a valid email address'),
  
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City name too long')
    .optional()
    .or(z.literal('')),
  
  state: z
    .string()
    .min(2, 'State must be at least 2 characters')
    .max(50, 'State name too long')
    .optional()
    .or(z.literal('')),
  
  address: z
    .string()
    .min(10, 'Please enter a complete address')
    .max(500, 'Address too long')
    .optional()
    .or(z.literal('')),
  
  pincode: z
    .string()
    .regex(pincodeRegex, 'Please enter a valid 6-digit PIN code')
    .optional()
    .or(z.literal('')),
  
  business_name: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name too long')
    .optional()
    .or(z.literal('')),
  
  gst_number: z
    .string()
    .regex(gstRegex, 'Please enter a valid GST number (15 characters)')
    .optional()
    .or(z.literal(''))
})

export const completeProfileSchema = profileSchema.extend({
  farm_size: z
    .string()
    .transform((val) => val === '' ? undefined : parseFloat(val))
    .refine((val) => val === undefined || (val > 0 && val <= 10000), {
      message: 'Farm size must be between 0 and 10,000 acres'
    })
    .optional()
})

export const farmerProfileSchema = z.object({
  farm_name: z
    .string()
    .min(2, 'Farm name must be at least 2 characters')
    .max(100, 'Farm name too long')
    .optional()
    .or(z.literal('')),
  
  farm_location: z
    .string()
    .min(2, 'Farm location must be at least 2 characters')
    .max(200, 'Farm location too long')
    .optional()
    .or(z.literal('')),
  
  farm_size: z
    .string()
    .transform((val) => val === '' ? undefined : parseFloat(val))
    .refine((val) => val === undefined || (val > 0 && val <= 10000), {
      message: 'Farm size must be between 0 and 10,000 acres'
    })
    .optional(),
  
  farming_experience: z
    .string()
    .transform((val) => val === '' ? undefined : parseInt(val))
    .refine((val) => val === undefined || (val >= 0 && val <= 100), {
      message: 'Farming experience must be between 0 and 100 years'
    })
    .optional(),
  
  farming_type: z
    .array(z.enum(['Organic', 'Conventional', 'Mixed']))
    .min(1, 'Please select at least one farming type')
    .optional(),
  
  soil_type: z
    .enum(['Clay', 'Sandy', 'Loamy', 'Silt', 'Peaty', 'Chalky'], {
      error: 'Please select a valid soil type'
    })
    .optional()
    .or(z.literal('')),
  
  water_source: z
    .array(z.enum(['Borewell', 'Canal', 'River', 'Rainwater', 'Tank']))
    .min(1, 'Please select at least one water source')
    .optional(),
  
  bank_account: z
    .string()
    .min(9, 'Bank account number must be at least 9 digits')
    .max(18, 'Bank account number too long')
    .regex(/^\d+$/, 'Bank account number must contain only digits')
    .optional()
    .or(z.literal('')),
  
  ifsc_code: z
    .string()
    .length(11, 'IFSC code must be exactly 11 characters')
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code')
    .optional()
    .or(z.literal('')),
  
  pan_number: z
    .string()
    .length(10, 'PAN number must be exactly 10 characters')
    .regex(panRegex, 'Please enter a valid PAN number (e.g., ABCDE1234F)')
    .optional()
    .or(z.literal('')),
  
  aadhar_number: z
    .string()
    .regex(aadharRegex, 'Please enter a valid Aadhar number')
    .transform((val) => val.replace(/\s/g, '')) 
    .optional()
    .or(z.literal(''))
})

export const updateProfileSchema = profileSchema.merge(farmerProfileSchema).partial()

export const roleSpecificValidation = {
  farmer: (data: any) => {
    const errors: string[] = []
    
    if (!data.farm_size && data.role === 'farmer') {
      errors.push('Farm size is recommended for farmers')
    }
    return errors
  },
  
  supplier: (data: any) => {
    const errors: string[] = []
    
    if (!data.business_name && data.role === 'supplier') {
      errors.push('Business name is required for suppliers')
    }
    if (!data.gst_number && data.role === 'supplier') {
      errors.push('GST number is recommended for suppliers')
    }
    return errors
  },
  
  consumer: (data: any) => {
    
    return []
  },
  
  admin: (data: any) => {
    
    return []
  }
}

export const fieldValidators = {
  phone: (phone: string) => {
    if (!phone) return 'Phone number is required'
    if (!phoneRegex.test(phone)) return 'Please enter a valid Indian phone number'
    return null
  },
  
  gst: (gst: string) => {
    if (!gst) return null 
    if (!gstRegex.test(gst)) return 'Please enter a valid GST number'
    return null
  },
  
  pincode: (pincode: string) => {
    if (!pincode) return null 
    if (!pincodeRegex.test(pincode)) return 'Please enter a valid 6-digit PIN code'
    return null
  },
  
  email: (email: string) => {
    if (!email) return 'Email is required'
    if (!z.string().email().safeParse(email).success) return 'Please enter a valid email address'
    return null
  }
}

export type ValidationResult = {
  success: boolean
  errors: Record<string, string[]>
  data?: any
}

export function validateFormData(schema: z.ZodSchema, data: any): ValidationResult {
  try {
    const validatedData = schema.parse(data)
    return {
      success: true,
      errors: {},
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.issues.forEach((err) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      
      return {
        success: false,
        errors
      }
    }
    
    return {
      success: false,
      errors: { general: ['Validation failed'] }
    }
  }
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
] as const

export type IndianState = typeof INDIAN_STATES[number]