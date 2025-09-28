import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/suppliers - Get all suppliers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const verified = searchParams.get('verified')

    const whereClause: any = {
      role: 'SUPPLIER'
    }

    if (city) {
      whereClause.city = {
        contains: city,
        mode: 'insensitive'
      }
    }

    if (state) {
      whereClause.state = {
        contains: state,
        mode: 'insensitive'
      }
    }

    if (verified) {
      whereClause.isVerified = verified === 'true'
    }

    const suppliers = await prisma.profile.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        businessName: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        isVerified: true,
        createdAt: true,
        products: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Add stats for each supplier
    const suppliersWithStats = suppliers.map(supplier => ({
      ...supplier,
      totalProducts: supplier.products.length,
      activeProducts: supplier.products.filter(p => p.isActive).length
    }))

    return NextResponse.json({ suppliers: suppliersWithStats })
  } catch (error) {
    console.error('Suppliers fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

// POST /api/suppliers - Create new supplier (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      email,
      fullName,
      businessName,
      phone,
      city,
      state,
      address,
      pincode,
      gstNumber
    } = body

    // Validate required fields
    if (!id || !email || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supplier = await prisma.profile.create({
      data: {
        id,
        email,
        fullName,
        businessName,
        phone,
        city,
        state,
        address,
        pincode,
        gstNumber,
        role: 'SUPPLIER'
      }
    })

    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Supplier creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}