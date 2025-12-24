/**
 * Editorial Media Component
 * 
 * Image and video display with responsive behavior.
 * Handles lazy loading and optimization.
 */

import React from 'react'
import { editorialSpacing } from './tokens/spacing'

interface ImageProps {
  src: string
  alt: string
  aspectRatio?: '16:9' | '4:3' | '1:1' | '3:2' | 'auto'
  className?: string
  style?: React.CSSProperties
  priority?: boolean
}

export function Image({
  src,
  alt,
  aspectRatio = '16:9',
  className = '',
  style = {},
  priority = false,
}: ImageProps) {
  const aspectRatioStyles: Record<string, React.CSSProperties> = {
    '16:9': { aspectRatio: '16 / 9' },
    '4:3': { aspectRatio: '4 / 3' },
    '1:1': { aspectRatio: '1 / 1' },
    '3:2': { aspectRatio: '3 / 2' },
    'auto': {},
  }

  return (
    <div
      className={`editorial-media editorial-media--image ${className}`}
      style={{
        width: '100%',
        marginBottom: editorialSpacing.md,
        ...aspectRatioStyles[aspectRatio],
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  )
}

interface VideoProps {
  src: string
  poster?: string
  className?: string
  style?: React.CSSProperties
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
}

export function Video({
  src,
  poster,
  className = '',
  style = {},
  autoPlay = false,
  loop = false,
  muted = true,
}: VideoProps) {
  return (
    <div
      className={`editorial-media editorial-media--video ${className}`}
      style={{
        width: '100%',
        marginBottom: editorialSpacing.md,
        aspectRatio: '16 / 9',
        ...style,
      }}
    >
      <video
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        controls
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  )
}

// Main Media component
export default function Media({
  type = 'image',
  ...props
}: { type?: 'image' | 'video' } & (ImageProps | VideoProps)) {
  if (type === 'image') {
    return <Image {...(props as ImageProps)} />
  }
  return <Video {...(props as VideoProps)} />
}

