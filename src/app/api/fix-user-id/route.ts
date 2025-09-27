import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { currentUserId, oldUserId } = await request.json()
    
    if (!currentUserId || !oldUserId) {
      return NextResponse.json({ error: 'Both user IDs are required' }, { status: 400 })
    }
    
    // Get the existing profile
    const existingProfile = await prisma.profile.findUnique({
      where: { id: oldUserId },
      include: { farmerProfile: true }
    })
    
    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    
    // Use a transaction to safely migrate the profile
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Delete farmer profile if it exists (due to foreign key constraint)
      if (existingProfile.farmerProfile) {
        await tx.farmerProfile.delete({ where: { id: oldUserId } })
      }
      
      // Step 2: Delete the old profile (this will free up the email constraint)
      await tx.profile.delete({ where: { id: oldUserId } })
      
      // Step 3: Create new profile with current user ID
      const newProfile = await tx.profile.create({
        data: {
          id: currentUserId,
          email: existingProfile.email,
          fullName: existingProfile.fullName,
          phone: existingProfile.phone,
          role: existingProfile.role,
          city: existingProfile.city,
          state: existingProfile.state,
          address: existingProfile.address,
          pincode: existingProfile.pincode,
          businessName: existingProfile.businessName,
          gstNumber: existingProfile.gstNumber,
          isVerified: existingProfile.isVerified
        }
      })
      
      // Step 4: Create farmer profile if it existed
      if (existingProfile.farmerProfile) {
        await tx.farmerProfile.create({
          data: {
            id: currentUserId,
            farmName: existingProfile.farmerProfile.farmName,
            farmLocation: existingProfile.farmerProfile.farmLocation,
            farmSize: existingProfile.farmerProfile.farmSize,
            farmingExperience: existingProfile.farmerProfile.farmingExperience,
            farmingType: existingProfile.farmerProfile.farmingType,
            bankAccount: existingProfile.farmerProfile.bankAccount,
            ifscCode: existingProfile.farmerProfile.ifscCode,
            panNumber: existingProfile.farmerProfile.panNumber,
            aadharNumber: existingProfile.farmerProfile.aadharNumber,
            soilType: existingProfile.farmerProfile.soilType,
            waterSource: existingProfile.farmerProfile.waterSource
          }
        })
      }
      
      return newProfile
    })
    
    return NextResponse.json({ 
      message: 'Profile migrated successfully',
      oldUserId,
      newUserId: currentUserId,
      profile: result 
    })
  } catch (error: any) {
    console.error('Fix user ID error:', error)
    return NextResponse.json({ 
      error: 'Failed to fix user ID',
      details: error.message 
    }, { status: 500 })
  }
}