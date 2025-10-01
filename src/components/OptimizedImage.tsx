'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  priority?: boolean
  fill?: boolean
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  quality = 80,
  format = 'webp',
  priority = false,
  fill = false,
}: OptimizedImageProps) {
  const [error, setError] = useState(false)

  // If image loading fails, show placeholder
  if (error) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-4xl">📷</span>
      </div>
    )
  }

  // Construct optimized image URL
  const optimizedSrc = `/api/optimize-image?url=${encodeURIComponent(src)}&quality=${quality}&format=${format}${
    width ? `&width=${width}` : ''
  }${height ? `&height=${height}` : ''}`

  // Use Next.js Image for automatic optimization
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        quality={quality}
        priority={priority}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 500}
      height={height || 500}
      className={className}
      quality={quality}
      priority={priority}
      onError={() => setError(true)}
    />
  )
}
