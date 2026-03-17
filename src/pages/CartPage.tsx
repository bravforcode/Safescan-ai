import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getGradeConfig } from '../lib/utils';

export function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col pb-28 md:pb-8 min-h-screen">
      <header className="glassmorphism md:bg-transparent sticky top-0 z-40 px-5 md:px-8 pt-10 md:pt-8 pb-4 border-b border-primary-50 md:border-none flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ตะกร้าสินค้า</h1>
          <p className="text-sm text-gray-400">{items.length} รายการ</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => { if (window.confirm('ลบสินค้าทั้งหมดในตะกร้า?')) clearCart(); }}
            className="text-sm text-red-400 font-medium hover:text-red-600 transition-colors"
          >
            ล้างทั้งหมด
          </button>
        )}
      </header>

      <div className="px-5 md:px-8 pt-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-gray-200 text-8xl mb-4">shopping_cart</span>
            <h2 className="text-xl font-bold text-gray-500 mb-2">ตะกร้าว่างเปล่า</h2>
            <p className="text-sm text-gray-400 mb-6">สแกนสินค้าแล้วกดซื้อเพื่อเพิ่มในตะกร้า</p>
            <button onClick={() => navigate('/scan')} className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
              ไปสแกนสินค้า
            </button>
          </div>
        ) : (
          <div className="md:grid md:grid-cols-3 md:gap-8 md:items-start space-y-4 md:space-y-0">
            {/* Items list — takes 2 cols on desktop */}
            <div className="md:col-span-2 space-y-3">
              {items.map(item => (
                <div key={`${item.product.barcode}-${item.buyOption.store}`} className="card p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="material-symbols-outlined text-gray-300 text-2xl">inventory_2</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">{item.product.brand}</p>
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.product.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.buyOption.store}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getGradeConfig(item.product.grade).badgeBg} ${getGradeConfig(item.product.grade).text}`}>เกรด {item.product.grade}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.barcode, item.buyOption.store)}
                      className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 hover:bg-red-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-red-400 text-sm">close</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1">
                      <button onClick={() => updateQuantity(item.product.barcode, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-primary-50 transition-colors">
                        <span className="material-symbols-outlined text-sm text-primary-500">remove</span>
                      </button>
                      <span className="font-bold text-gray-900 w-5 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.barcode, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-primary-50 transition-colors">
                        <span className="material-symbols-outlined text-sm text-primary-500">add</span>
                      </button>
                    </div>
                    <a
                      href={item.buyOption.searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-semibold text-primary-500 hover:text-primary-600"
                    >
                      ซื้อที่ {item.buyOption.store}
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary — sticky on desktop */}
            <div className="md:sticky md:top-24">
              <div className="card p-5 space-y-4">
                <h3 className="font-bold text-gray-800">สรุปรายการ</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>รายการทั้งหมด</span>
                    <span className="font-semibold">{items.length} ชิ้น</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>จำนวนสินค้า</span>
                    <span className="font-semibold">{items.reduce((s, i) => s + i.quantity, 0)} ชิ้น</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 mb-3">ระบบจะพาคุณไปยังร้านค้าที่เลือก</p>
                  <div className="space-y-2">
                    {items.slice(0, 2).map(item => (
                      <a
                        key={`${item.product.barcode}-${item.buyOption.store}`}
                        href={item.buyOption.searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full p-2.5 bg-gray-50 hover:bg-primary-50 rounded-xl transition-colors text-sm"
                      >
                        <span className="text-lg">{item.buyOption.storeIcon}</span>
                        <span className="flex-1 font-medium text-gray-700 truncate">{item.product.name}</span>
                        <span className="material-symbols-outlined text-primary-400 text-sm">open_in_new</span>
                      </a>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const seen = new Set<string>();
                    items.forEach(item => {
                      if (!seen.has(item.buyOption.store)) {
                        seen.add(item.buyOption.store);
                        window.open(item.buyOption.searchUrl, '_blank', 'noopener,noreferrer');
                      }
                    });
                  }}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5"
                >
                  <span className="material-symbols-outlined">shopping_bag</span>
                  ไปซื้อสินค้าได้เลย
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
