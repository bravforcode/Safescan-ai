import { useState } from 'react';

interface ProductImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Icon shown when image fails or is missing. Defaults to 'inventory_2' */
  fallbackIcon?: string;
  iconClassName?: string;
}

/**
 * Product image with automatic fallback to a Material Symbol icon on load error.
 * Use this instead of bare <img> tags for all product images.
 */
export function ProductImage({
  src,
  alt = '',
  className = 'w-full h-full object-contain',
  fallbackIcon = 'inventory_2',
  iconClassName = 'text-gray-300',
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className={`material-symbols-outlined ${iconClassName}`}>
        {fallbackIcon}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
