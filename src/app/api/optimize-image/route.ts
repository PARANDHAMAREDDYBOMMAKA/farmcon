import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const width = formData.get('width') ? parseInt(formData.get('width') as string) : undefined
    const height = formData.get('height') ? parseInt(formData.get('height') as string) : undefined
    const quality = formData.get('quality') ? parseInt(formData.get('quality') as string) : 80
    const format = formData.get('format') as 'webp' | 'jpeg' | 'png' || 'webp'

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let image = sharp(buffer)

    if (width || height) {
      image = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    let outputBuffer: Buffer

    switch (format) {
      case 'webp':
        outputBuffer = await image.webp({ quality }).toBuffer()
        break
      case 'jpeg':
        outputBuffer = await image.jpeg({ quality }).toBuffer()
        break
      case 'png':
        outputBuffer = await image.png({ quality }).toBuffer()
        break
      default:
        outputBuffer = await image.webp({ quality }).toBuffer()
    }

    const metadata = await sharp(outputBuffer).metadata()

    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': `image/${format}`,
        'Content-Length': outputBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Image-Width': metadata.width?.toString() || '',
        'X-Image-Height': metadata.height?.toString() || '',
        'X-Original-Size': buffer.length.toString(),
        'X-Optimized-Size': outputBuffer.length.toString(),
        'X-Compression-Ratio': ((1 - outputBuffer.length / buffer.length) * 100).toFixed(2) + '%',
      },
    })
  } catch (error: any) {
    console.error('Image optimization error:', error)
    return NextResponse.json(
      { error: 'Failed to optimize image', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    const width = searchParams.get('width') ? parseInt(searchParams.get('width')!) : undefined
    const height = searchParams.get('height') ? parseInt(searchParams.get('height')!) : undefined
    const quality = searchParams.get('quality') ? parseInt(searchParams.get('quality')!) : 80
    const format = (searchParams.get('format') as 'webp' | 'jpeg' | 'png') || 'webp'

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided' }, { status: 400 })
    }

    const response = await fetch(imageUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 })
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    let image = sharp(buffer)

    if (width || height) {
      image = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    let outputBuffer: Buffer

    switch (format) {
      case 'webp':
        outputBuffer = await image.webp({ quality }).toBuffer()
        break
      case 'jpeg':
        outputBuffer = await image.jpeg({ quality }).toBuffer()
        break
      case 'png':
        outputBuffer = await image.png({ quality }).toBuffer()
        break
      default:
        outputBuffer = await image.webp({ quality }).toBuffer()
    }

    const metadata = await sharp(outputBuffer).metadata()

    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': `image/${format}`,
        'Content-Length': outputBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Image-Width': metadata.width?.toString() || '',
        'X-Image-Height': metadata.height?.toString() || '',
        'X-Original-Size': buffer.length.toString(),
        'X-Optimized-Size': outputBuffer.length.toString(),
        'X-Compression-Ratio': ((1 - outputBuffer.length / buffer.length) * 100).toFixed(2) + '%',
      },
    })
  } catch (error: any) {
    console.error('Image optimization error:', error)
    return NextResponse.json(
      { error: 'Failed to optimize image', details: error.message },
      { status: 500 }
    )
  }
}
