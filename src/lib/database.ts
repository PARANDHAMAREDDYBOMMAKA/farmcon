import { supabase } from './supabase'

import type { User, FarmerProfile } from '@/types'

export class DatabaseError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as any).code
        if (code === 'PGRST301' || code === 'PGRST116' || code?.startsWith('23')) {
          throw error
        }
      }

      if (attempt === maxRetries) break

      await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
    }
  }

  throw new DatabaseError(
    `Operation failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
    'RETRY_EXHAUSTED',
    lastError
  )
}

function validateProfileData(data: Partial<User>): void {
  if (data.email && !data.email.includes('@')) {
    throw new ValidationError('Invalid email format', 'email')
  }
  
  if (data.phone && !/^\+?[\d\s\-\(\)]{10,15}$/.test(data.phone)) {
    throw new ValidationError('Invalid phone number format', 'phone')
  }
  
  if (data.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(data.gstNumber)) {
    throw new ValidationError('Invalid GST number format', 'gstNumber')
  }
  
  if (data.pincode && !/^[1-9][0-9]{5}$/.test(data.pincode)) {
    throw new ValidationError('Invalid PIN code format', 'pincode')
  }
}

export const profileOperations = {
  
  async getProfile(userId: string): Promise<User | null> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null 
        }
        throw new DatabaseError(
          `Failed to fetch profile: ${error.message}`,
          error.code,
          error
        )
      }

      return data
    })
  },

  async upsertProfile(profileData: Partial<User>): Promise<User> {
    validateProfileData(profileData)

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .upsert([profileData])
        .select()
        .single()

      if (error) {
        throw new DatabaseError(
          `Failed to save profile: ${error.message}`,
          error.code,
          error
        )
      }

      return data
    })
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    validateProfileData(updates)

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new DatabaseError(
          `Failed to update profile: ${error.message}`,
          error.code,
          error
        )
      }

      return data
    })
  },

  async isProfileComplete(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId)
    if (!profile) return false

    const requiredFields = ['full_name', 'phone', 'role']
    return requiredFields.every(field => profile[field as keyof User])
  }
}

export const farmerOperations = {
  
  async getFarmerProfile(userId: string): Promise<FarmerProfile | null> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null 
        }
        throw new DatabaseError(
          `Failed to fetch farmer profile: ${error.message}`,
          error.code,
          error
        )
      }

      return data
    })
  },

  async upsertFarmerProfile(farmerData: Partial<FarmerProfile>): Promise<FarmerProfile> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('farmer_profiles')
        .upsert([{
          ...farmerData,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        throw new DatabaseError(
          `Failed to save farmer profile: ${error.message}`,
          error.code,
          error
        )
      }

      return data
    })
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single()

    return !error
  } catch {
    return false
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof DatabaseError) {
    return error.message
  }
  
  if (error instanceof ValidationError) {
    return error.message
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as Error).message
  }
  
  return 'An unexpected error occurred'
}

export async function getDatabaseStatus(): Promise<{
  connected: boolean
  latency?: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    await checkDatabaseHealth()
    return {
      connected: true,
      latency: Date.now() - startTime
    }
  } catch (error) {
    return {
      connected: false,
      error: getErrorMessage(error)
    }
  }
}