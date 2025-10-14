import { PrismaClient, UserRole, OrderStatus, CropStatus, EquipmentStatus } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export class PrismaError extends Error {
  constructor(message: string, public code?: string, public meta?: any) {
    super(message)
    this.name = 'PrismaError'
  }
}

export const dbOperations = {
  
  profile: {
    async create(data: {
      id: string
      email: string
      fullName?: string
      phone?: string
      role: UserRole
      city?: string
      state?: string
      address?: string
      pincode?: string
      businessName?: string
      gstNumber?: string
    }) {
      try {
        return await prisma.profile.create({
          data: {
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
            gstNumber: data.gstNumber
          }
        })
      } catch (error: any) {
        throw new PrismaError(
          `Failed to create profile: ${error.message}`,
          error.code,
          error.meta
        )
      }
    },

    async findById(id: string) {
      try {
        console.log('[Prisma findById] Searching for id:', id)
        const profile = await prisma.profile.findUnique({
          where: { id },
          include: {
            farmerProfile: true
          }
        })
        console.log('[Prisma findById] Result:', profile ? `Found profile for ${profile.email}` : 'Not found')
        return profile
      } catch (error: any) {
        console.error('[Prisma findById] ERROR:', error)
        console.error('[Prisma findById] Error details:', {
          message: error.message,
          code: error.code,
          meta: error.meta,
          name: error.name
        })
        throw new PrismaError(
          `Failed to find profile: ${error.message}`,
          error.code,
          error.meta
        )
      }
    },

    async findByEmail(email: string) {
      try {
        return await prisma.profile.findUnique({
          where: { email },
          include: {
            farmerProfile: true
          }
        })
      } catch (error: any) {
        throw new PrismaError(
          `Failed to find profile by email: ${error.message}`,
          error.code,
          error.meta
        )
      }
    },

    async update(id: string, data: Partial<{
      fullName: string
      phone: string
      city: string
      state: string
      address: string
      pincode: string
      businessName: string
      gstNumber: string
      isVerified: boolean
    }>) {
      try {
        return await prisma.profile.update({
          where: { id },
          data,
          include: {
            farmerProfile: true
          }
        })
      } catch (error: any) {
        throw new PrismaError(
          `Failed to update profile: ${error.message}`,
          error.code,
          error.meta
        )
      }
    },

    async upsert(data: {
      id: string
      email: string
      fullName?: string
      phone?: string
      role: UserRole
      city?: string
      state?: string
      address?: string
      pincode?: string
      businessName?: string
      gstNumber?: string
    }) {
      try {
        console.log('Prisma upsert - data:', { id: data.id, email: data.email, role: data.role })

        const existingProfileByEmail = await prisma.profile.findUnique({
          where: { email: data.email }
        })

        if (existingProfileByEmail && existingProfileByEmail.id !== data.id) {
          
          console.log('Deleting old profile with different ID and creating new one with current user ID')
          console.log('Old profile ID:', existingProfileByEmail.id, 'New user ID:', data.id)
          await prisma.profile.delete({
            where: { email: data.email }
          })
        }

        const profile = await prisma.profile.upsert({
          where: { id: data.id },
          update: {
            email: data.email, 
            fullName: data.fullName,
            phone: data.phone,
            role: data.role,
            city: data.city,
            state: data.state,
            address: data.address,
            pincode: data.pincode,
            businessName: data.businessName,
            gstNumber: data.gstNumber
          },
          create: {
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
            gstNumber: data.gstNumber
          },
          include: {
            farmerProfile: true
          }
        })

        console.log('Prisma upsert - profile saved with id:', profile.id)
        return profile
      } catch (error: any) {
        console.error('Prisma upsert error:', error)
        throw new PrismaError(
          `Failed to upsert profile: ${error.message}`,
          error.code,
          error.meta
        )
      }
    },

  },

  farmer: {
    async create(data: {
      id: string
      farmName?: string
      farmLocation?: string
      farmSize?: number
      farmingExperience?: number
      farmingType?: string[]
      bankAccount?: string
      ifscCode?: string
      panNumber?: string
      aadharNumber?: string
      soilType?: string
      waterSource?: string[]
    }) {
      try {
        return await prisma.farmerProfile.create({
          data: {
            id: data.id,
            farmName: data.farmName,
            farmLocation: data.farmLocation,
            farmSize: data.farmSize,
            farmingExperience: data.farmingExperience,
            farmingType: data.farmingType || [],
            bankAccount: data.bankAccount,
            ifscCode: data.ifscCode,
            panNumber: data.panNumber,
            aadharNumber: data.aadharNumber,
            soilType: data.soilType,
            waterSource: data.waterSource || []
          }
        })
      } catch (error: any) {
        throw new PrismaError(
          `Failed to create farmer profile: ${error.message}`,
          error.code,
          error.meta
        )
      }
    },

    async findById(id: string) {
      try {
        return await prisma.farmerProfile.findUnique({
          where: { id },
          include: {
            profile: true
          }
        })
      } catch (error: any) {
        throw new PrismaError(
          `Failed to find farmer profile: ${error.message}`,
          error.code,
          error.meta
        )
      }
    },

    async update(id: string, data: Partial<{
      farmName: string
      farmLocation: string
      farmSize: number
      farmingExperience: number
      farmingType: string[]
      bankAccount: string
      ifscCode: string
      panNumber: string
      aadharNumber: string
      soilType: string
      waterSource: string[]
    }>) {
      try {
        return await prisma.farmerProfile.update({
          where: { id },
          data
        })
      } catch (error: any) {
        throw new PrismaError(
          `Failed to update farmer profile: ${error.message}`,
          error.code,
          error.meta
        )
      }
    },

    async upsert(data: {
      id: string
      farmName?: string
      farmLocation?: string
      farmSize?: number
      farmingExperience?: number
      farmingType?: string[]
      bankAccount?: string
      ifscCode?: string
      panNumber?: string
      aadharNumber?: string
      soilType?: string
      waterSource?: string[]
    }) {
      try {
        return await prisma.farmerProfile.upsert({
          where: { id: data.id },
          update: {
            farmName: data.farmName,
            farmLocation: data.farmLocation,
            farmSize: data.farmSize,
            farmingExperience: data.farmingExperience,
            farmingType: data.farmingType || [],
            bankAccount: data.bankAccount,
            ifscCode: data.ifscCode,
            panNumber: data.panNumber,
            aadharNumber: data.aadharNumber,
            soilType: data.soilType,
            waterSource: data.waterSource || []
          },
          create: {
            id: data.id,
            farmName: data.farmName,
            farmLocation: data.farmLocation,
            farmSize: data.farmSize,
            farmingExperience: data.farmingExperience,
            farmingType: data.farmingType || [],
            bankAccount: data.bankAccount,
            ifscCode: data.ifscCode,
            panNumber: data.panNumber,
            aadharNumber: data.aadharNumber,
            soilType: data.soilType,
            waterSource: data.waterSource || []
          }
        })
      } catch (error: any) {
        throw new PrismaError(
          `Failed to upsert farmer profile: ${error.message}`,
          error.code,
          error.meta
        )
      }
    }
  },

  product: {
    async findMany(options?: {
      where?: any
      include?: any
      skip?: number
      take?: number
    }) {
      try {
        return await prisma.product.findMany({
          where: options?.where,
          include: options?.include || {
            supplier: true,
            category: true
          },
          skip: options?.skip,
          take: options?.take
        })
      } catch (error: any) {
        throw new PrismaError(
          `Failed to find products: ${error.message}`,
          error.code,
          error.meta
        )
      }
    }
  },

  order: {
    async findMany(userId: string, type: 'customer' | 'seller' = 'customer') {
      try {
        const whereClause = type === 'customer' 
          ? { customerId: userId }
          : { sellerId: userId }

        return await prisma.order.findMany({
          where: whereClause,
          include: {
            items: {
              include: {
                product: true,
                cropListing: true,
                equipment: true
              }
            },
            customer: true,
            seller: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
      } catch (error: any) {
        throw new PrismaError(
          `Failed to find orders: ${error.message}`,
          error.code,
          error.meta
        )
      }
    }
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

export async function closeDatabaseConnection() {
  await prisma.$disconnect()
}

export type { UserRole, OrderStatus, CropStatus, EquipmentStatus }
export type Profile = Awaited<ReturnType<typeof dbOperations.profile.findById>>
export type FarmerProfile = Awaited<ReturnType<typeof dbOperations.farmer.findById>>