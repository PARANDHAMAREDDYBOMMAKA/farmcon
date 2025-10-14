import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'
import { Prisma } from '@prisma/client'
import { cache, CacheKeys } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const cacheKey = CacheKeys.cart(userId)
    const cached = await cache.get(cacheKey)

    if (cached) {
      return NextResponse.json({ cartItems: cached })
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            supplier: true,
            category: true
          }
        },
        cropListing: {
          include: {
            farmer: true,
            crop: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    await cache.set(cacheKey, cartItems, 60)

    return NextResponse.json({ cartItems })
  } catch (error) {
    console.error('Cart fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productId, cropListingId, quantity } = body

    if (!userId || !quantity || (!productId && !cropListingId)) {
      return NextResponse.json(
        { error: 'User ID, quantity, and either product ID or crop listing ID are required' },
        { status: 400 }
      )
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        ...(productId ? { productId } : { cropListingId })
      }
    })

    let cartItem

    if (existingItem) {
      
      const currentQty = typeof existingItem.quantity === 'number'
        ? existingItem.quantity
        : parseFloat(existingItem.quantity.toString())
      const newQty = currentQty + parseFloat(quantity.toString())

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
        include: {
          product: {
            include: {
              supplier: true,
              category: true
            }
          },
          cropListing: {
            include: {
              farmer: true,
              crop: true
            }
          }
        }
      })
    } else {
      
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId: productId || null,
          cropListingId: cropListingId || null,
          quantity: parseFloat(quantity.toString())
        },
        include: {
          product: {
            include: {
              supplier: true,
              category: true
            }
          },
          cropListing: {
            include: {
              farmer: true,
              crop: true
            }
          }
        }
      })
    }

    await cache.del(CacheKeys.cart(userId))

    return NextResponse.json({ cartItem })
  } catch (error) {
    console.error('Cart add error:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { cartItemId, quantity } = body

    if (!cartItemId || !quantity) {
      return NextResponse.json(
        { error: 'Cart item ID and quantity are required' },
        { status: 400 }
      )
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: parseFloat(quantity.toString()) },
      include: {
        product: {
          include: {
            supplier: true,
            category: true
          }
        },
        cropListing: {
          include: {
            farmer: true,
            crop: true
          }
        }
      }
    })

    await cache.del(CacheKeys.cart(existingItem.userId))

    return NextResponse.json({ cartItem })
  } catch (error) {
    console.error('Cart update error:', error)
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cartItemId = searchParams.get('cartItemId')
    const userId = searchParams.get('userId')
    const clearAll = searchParams.get('clearAll') === 'true'

    if (clearAll && userId) {
      
      await prisma.cartItem.deleteMany({
        where: { userId }
      })
      
      await cache.del(CacheKeys.cart(userId))
      return NextResponse.json({ message: 'Cart cleared successfully' })
    }

    if (!cartItemId) {
      return NextResponse.json(
        { error: 'Cart item ID is required' },
        { status: 400 }
      )
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId }
    })

    await prisma.cartItem.delete({
      where: { id: cartItemId }
    })

    if (existingItem) {
      await cache.del(CacheKeys.cart(existingItem.userId))
    }

    return NextResponse.json({ message: 'Cart item removed successfully' })
  } catch (error) {
    console.error('Cart delete error:', error)
    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}