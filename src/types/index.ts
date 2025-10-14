
import type {
  UserRole as PrismaUserRole,
  OrderStatus as PrismaOrderStatus,
  CropStatus as PrismaCropStatus,
  EquipmentStatus as PrismaEquipmentStatus,
  Profile as PrismaProfile,
  FarmerProfile as PrismaFarmerProfile,
  Product,
  Category,
  Crop,
  CropListing,
  Order,
  OrderItem,
  CartItem,
  MarketPrice,
  Notification,
  Review,
  Equipment,
  WeatherData,
  Profile
} from '@prisma/client'

export type UserRole = PrismaUserRole
export type OrderStatus = PrismaOrderStatus  
export type CropStatus = PrismaCropStatus
export type EquipmentStatus = PrismaEquipmentStatus
export type User = PrismaProfile
export type FarmerProfile = PrismaFarmerProfile

export type {
  Product,
  Category,
  Crop,
  CropListing,
  Order,
  OrderItem,
  CartItem,
  MarketPrice,
  Notification,
  Review,
  Equipment,
  WeatherData,
  Profile
}

export type ProfileWithFarmer = PrismaProfile & {
  farmerProfile?: PrismaFarmerProfile | null
}

export type CropWithDetails = Crop & {
  farmer: {
    fullName: string | null
    email: string
    phone: string | null
    city: string | null
    state: string | null
  }
  listings: CropListing[]
}

export type CropListingWithDetails = CropListing & {
  crop: Crop
  farmer: Profile
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}