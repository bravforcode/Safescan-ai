import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { SafetyBadge } from './SafetyBadge';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  animDelay?: number;
}

export function ProductCard({ product, compact = false, animDelay = 0 }: ProductCardProps) {
  if (compact) {
    return (
      <Link
        to={`/product/${product.barcode}`}
        state={{ product }}
        className="card-interactive block w-36 flex-shrink-0 p-3 relative group animate-fadeUp"
        style={{ animationDelay: `${animDelay}ms` }}
      >
        <div className="absolute top-2 left-2 z-10 transition-transform duration-200 group-hover:scale-110">
          <SafetyBadge grade={product.grade} size="sm" />
        </div>
        {product.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 text-xs font-bold bg-white/95 rounded-full px-1.5 py-0.5 z-10 shadow-sm border border-yellow-100 transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
            <span className="text-yellow-400 text-[10px]">★</span>
            <span className="text-gray-700">{product.rating.toFixed(1)}</span>
          </div>
        )}
        <div className="h-28 flex items-center justify-center mb-2.5 bg-gray-50 rounded-xl overflow-hidden transition-colors duration-300 group-hover:bg-primary-50">
          <ProductImage
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-110"
            iconClassName="text-gray-300 text-4xl transition-colors duration-300 group-hover:text-primary-300"
          />
        </div>
        <p className="text-[11px] text-gray-400 mb-0.5 truncate font-medium transition-colors duration-200 group-hover:text-primary-500">{product.brand}</p>
        <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug transition-colors duration-200 group-hover:text-gray-900">{product.name}</h3>
      </Link>
    );
  }

  return (
    <Link
      to={`/product/${product.barcode}`}
      state={{ product }}
      className="card-interactive flex items-center gap-3 p-4 group animate-fadeUp"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 transition-all duration-300 group-hover:bg-primary-50 group-hover:border-primary-200">
        <ProductImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-110"
          iconClassName="text-gray-300 text-2xl transition-colors duration-300 group-hover:text-primary-300"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 mb-0.5 font-medium transition-colors duration-200 group-hover:text-primary-500">{product.brand}</p>
        <h3 className="font-semibold text-gray-900 text-sm truncate transition-colors duration-200 group-hover:text-primary-600">{product.name}</h3>
        {product.categories.length > 0 && (
          <p className="text-xs text-primary-500 mt-0.5 truncate transition-colors duration-200 group-hover:text-primary-600">{product.categories[0]}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
        <SafetyBadge grade={product.grade} size="sm" />
        <span className="text-xs text-gray-400 tabular-nums transition-colors duration-200 group-hover:text-gray-600">{product.safetyScore}/100</span>
      </div>
    </Link>
  );
}
