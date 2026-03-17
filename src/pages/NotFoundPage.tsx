import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center animate-fadeIn">
      <div className="mb-6">
        <span className="material-symbols-outlined text-gray-200" style={{ fontSize: '96px' }}>
          search_off
        </span>
      </div>
      <h1 className="text-5xl font-black text-gray-900 mb-2">404</h1>
      <h2 className="text-xl font-bold text-gray-600 mb-3">ไม่พบหน้าที่ต้องการ</h2>
      <p className="text-gray-400 mb-8 max-w-sm">
        หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่มีอยู่
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate('/')}
          className="btn-primary flex items-center gap-2 justify-center"
        >
          <span className="material-symbols-outlined text-sm">home</span>
          กลับหน้าแรก
        </button>
        <button
          onClick={() => navigate('/scan')}
          className="btn-secondary flex items-center gap-2 justify-center"
        >
          <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
          สแกนสินค้า
        </button>
      </div>
    </div>
  );
}
