import Image from 'next/image'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  iconSize?: number
  textClassName?: string
  withText?: boolean
  href?: string
}

export function BrandLogo({
  className,
  iconSize = 36,
  textClassName,
  withText = true,
  href = '/',
}: BrandLogoProps) {
  const content = (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src={BRAND.assets.icon}
        alt={`${BRAND.name} icon`}
        width={iconSize}
        height={iconSize}
        className="rounded-xl"
        priority
      />
      {withText ? (
        <span className={cn('text-xl font-bold tracking-tight text-foreground', textClassName)}>
          {BRAND.name}
        </span>
      ) : null}
    </div>
  )

  return <Link href={href}>{content}</Link>
}

