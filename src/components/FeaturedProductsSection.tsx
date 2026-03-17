import { useState } from 'react';
import { ProductCard } from './ProductCard';
import { useFeaturedProducts } from '../hooks/useFeaturedProducts';
import { CATEGORIES } from '../data';

export function FeaturedProductsSection() {
  const { products, loading } = useFeaturedProducts();
  const [activeCategory, setActiveCategory] = useState('all');

  const displayProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.categories?.some(c =>
        c.toLowerCase().includes(activeCategory.toLowerCase())
      ));

  return (
    <section className="animate-fadeUp delay-150">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          สินค้าแนะนำ
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-600 font-semibold">ข้อมูลจริง</span>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-3">ดึงข้อมูลล่าสุดจาก Open Food Facts Database</p>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 -mx-5 px-5">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeCategory === cat.id
                ? 'bg-primary-500 text-white shadow-card'
                : 'bg-white text-gray-600 border border-gray-100 hover:border-primary-200 hover:text-primary-600'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-5 px-5">
          {[1,2,3].map(i => (
            <div key={i} className="flex-shrink-0 w-36 card p-3">
              <div className="w-full h-24 skeleton rounded-xl mb-2" />
              <div className="h-3 w-20 skeleton rounded mb-1" />
              <div className="h-4 w-28 skeleton rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="md:hidden flex gap-3 overflow-x-auto hide-scrollbar -mx-5 px-5">
            {displayProducts.map((p, i) => (
              <ProductCard key={p.barcode} product={p} compact animDelay={i * 60} />
            ))}
          </div>
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            {displayProducts.slice(0, 6).map((p, i) => (
              <ProductCard key={p.barcode} product={p} animDelay={i * 60} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
