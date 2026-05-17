import Image from 'next/image'
import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'

type BrandBannerProps = {
  variant?: 'dark' | 'light'
  className?: string
  priority?: boolean
  alt?: string
}

export function BrandBanner({
  variant = 'dark',
  className,
  priority = false,
  alt,
}: BrandBannerProps) {
  const src = variant === 'dark' ? BRAND.assets.bannerDark : BRAND.assets.bannerLight

  return (
    <div className={cn('relative overflow-hidden rounded-3xl border border-primary/20', className)}>
      <Image
        src={src}
        alt={alt ?? `${BRAND.name} banner`}
        fill
        className="object-cover"
        priority={priority}
      />
    </div>
  )
}

