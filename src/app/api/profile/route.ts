import { NextRequest } from 'next/server'
import { z } from 'zod'
import { dbOperations } from '@/lib/prisma'
import { apiSuccess, apiError, handleApiError, parseJsonBody, parseQueryParams } from '@/lib/api-utils'

const getProfileSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
})

const createProfileSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
  email: z.string().email('Invalid email format'),
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?91?[6-9]\d{9}$/, 'Invalid phone number').optional(),
  role: z.enum(['farmer', 'consumer', 'supplier', 'admin']),
  city: z.string().min(2).max(50).optional(),
  state: z.string().min(2).max(50).optional(),
  address: z.string().min(10).max(500).optional(),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid pincode').optional(),
  businessName: z.string().min(2).max(100).optional(),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number').optional(),
})

const emptyToUndefined = z.string().transform(val => val === '' ? undefined : val).optional()

const updateProfileSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  fullName: emptyToUndefined,
  phone: emptyToUndefined,
  city: emptyToUndefined,
  state: emptyToUndefined,
  address: emptyToUndefined,
  pincode: emptyToUndefined,
  businessName: emptyToUndefined,
  gstNumber: emptyToUndefined,
  isVerified: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { userId } = parseQueryParams(searchParams, getProfileSchema)

    const profile = await dbOperations.profile.findById(userId)

    if (!profile) {
      return apiError('Profile not found', 404, 'NOT_FOUND')
    }

    return apiSuccess({ profile })
  } catch (error) {
    return handleApiError(error, 'GET /api/profile')
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await parseJsonBody(request, createProfileSchema)

    const profile = await dbOperations.profile.upsert({
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      role: data.role,
      city: data.city,
      state: data.state,
      address: data.address,
      pincode: data.pincode,
      businessName: data.businessName,
      gstNumber: data.gstNumber,
    })

    return apiSuccess({ profile }, 201)
  } catch (error) {
    return handleApiError(error, 'POST /api/profile')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await parseJsonBody(request, updateProfileSchema)
    const { userId, ...updates } = data

    const profile = await dbOperations.profile.update(userId, updates)

    return apiSuccess({ profile })
  } catch (error) {
    return handleApiError(error, 'PUT /api/profile')
  }
}
