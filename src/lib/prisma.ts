import { PrismaClient, UserRole, OrderStatus, CropStatus, EquipmentStatus } from '@prisma/client'
import { encryptSensitiveFields, decryptSensitiveFields } from './encryption'

declare global {
  var prisma: PrismaClient | undefined
}

const FARMER_SENSITIVE_FIELDS = ['bankAccount', 'panNumber', 'aadharNumber'] as const

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
        const profile = await prisma.profile.findUnique({
          where: { id },
          include: {
            farmerProfile: true
          }
        })
        if (profile?.farmerProfile) {
          profile.farmerProfile = decryptSensitiveFields(profile.farmerProfile, [...FARMER_SENSITIVE_FIELDS])
        }
        return profile
      } catch (error: any) {
        throw new PrismaError(
          `Failed to find profile: ${error.message}`,
          error.code,
          error.meta
        )
      }
    },

    async findByEmail(email: string) {
      try {
        const profile = await prisma.profile.findUnique({
          where: { email },
          include: {
            farmerProfile: true
          }
        })
        if (profile?.farmerProfile) {
          profile.farmerProfile = decryptSensitiveFields(profile.farmerProfile, [...FARMER_SENSITIVE_FIELDS])
        }
        return profile
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
        const profile = await prisma.$transaction(async (tx) => {
          const existingById = await tx.profile.findUnique({
            where: { id: data.id }
          })

          if (existingById) {
            return await tx.profile.update({
              where: { id: data.id },
              data: {
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
          }

          const existingByEmail = await tx.profile.findUnique({
            where: { email: data.email }
          })

          if (existingByEmail) {
            throw new PrismaError(
              'A profile with this email already exists',
              'P2002',
              { target: ['email'] }
            )
          }

          return await tx.profile.create({
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
            },
            include: {
              farmerProfile: true
            }
          })
        }, {
          isolationLevel: 'Serializable',
          maxWait: 5000,
          timeout: 10000
        })

        return profile
      } catch (error: any) {
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
        const encryptedData = encryptSensitiveFields(data, [...FARMER_SENSITIVE_FIELDS])
        return await prisma.farmerProfile.create({
          data: {
            id: encryptedData.id,
            farmName: encryptedData.farmName,
            farmLocation: encryptedData.farmLocation,
            farmSize: encryptedData.farmSize,
            farmingExperience: encryptedData.farmingExperience,
            farmingType: encryptedData.farmingType || [],
            bankAccount: encryptedData.bankAccount,
            ifscCode: encryptedData.ifscCode,
            panNumber: encryptedData.panNumber,
            aadharNumber: encryptedData.aadharNumber,
            soilType: encryptedData.soilType,
            waterSource: encryptedData.waterSource || []
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
        const profile = await prisma.farmerProfile.findUnique({
          where: { id },
          include: {
            profile: true
          }
        })
        if (profile) {
          return decryptSensitiveFields(profile, [...FARMER_SENSITIVE_FIELDS])
        }
        return profile
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
        const encryptedData = encryptSensitiveFields(data, [...FARMER_SENSITIVE_FIELDS])
        return await prisma.farmerProfile.update({
          where: { id },
          data: encryptedData
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
        const encryptedData = encryptSensitiveFields(data, [...FARMER_SENSITIVE_FIELDS])
        return await prisma.farmerProfile.upsert({
          where: { id: encryptedData.id },
          update: {
            farmName: encryptedData.farmName,
            farmLocation: encryptedData.farmLocation,
            farmSize: encryptedData.farmSize,
            farmingExperience: encryptedData.farmingExperience,
            farmingType: encryptedData.farmingType || [],
            bankAccount: encryptedData.bankAccount,
            ifscCode: encryptedData.ifscCode,
            panNumber: encryptedData.panNumber,
            aadharNumber: encryptedData.aadharNumber,
            soilType: encryptedData.soilType,
            waterSource: encryptedData.waterSource || []
          },
          create: {
            id: encryptedData.id,
            farmName: encryptedData.farmName,
            farmLocation: encryptedData.farmLocation,
            farmSize: encryptedData.farmSize,
            farmingExperience: encryptedData.farmingExperience,
            farmingType: encryptedData.farmingType || [],
            bankAccount: encryptedData.bankAccount,
            ifscCode: encryptedData.ifscCode,
            panNumber: encryptedData.panNumber,
            aadharNumber: encryptedData.aadharNumber,
            soilType: encryptedData.soilType,
            waterSource: encryptedData.waterSource || []
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