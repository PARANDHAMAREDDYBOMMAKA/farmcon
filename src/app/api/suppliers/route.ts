import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const verified = searchParams.get('verified')

    const filterKey = `${city || 'all'}:${state || 'all'}:${verified || 'all'}`
    const cacheKey = `farmcon:suppliers:${filterKey}`

    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json({ suppliers: cached, source: 'cache' })
    }

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

    const suppliersWithStats = suppliers.map(supplier => ({
      ...supplier,
      totalProducts: supplier.products.length,
      activeProducts: supplier.products.filter(p => p.isActive).length
    }))

    await cache.set(cacheKey, suppliersWithStats, 600)

    return NextResponse.json({ suppliers: suppliersWithStats })
  } catch (error) {
    console.error('Suppliers fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

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

    await cache.invalidatePattern('farmcon:suppliers:*')

    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Supplier creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}