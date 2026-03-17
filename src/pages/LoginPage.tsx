import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export function LoginPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]           = useState<'login' | 'signup'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    if (tab === 'login') {
      const err = await signIn(email, password);
      if (err) setError(err);
      else navigate('/');
    } else {
      if (!name.trim()) { setError('กรุณากรอกชื่อ'); setLoading(false); return; }
      const err = await signUp(email, password, name);
      if (err) setError(err);
      else setSuccess('สมัครสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-md animate-fadeUp">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 shadow-float mb-4">
            <span className="material-symbols-outlined text-white text-3xl">qr_code_scanner</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">SafeScan AI</h1>
          <p className="text-sm text-gray-400 mt-1">สแกนสินค้า รู้ทุกอย่าง ซื้อได้ทันที</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
            {(['login', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              </button>
            ))}
          </div>

          {/* Google */}
          <button
            onClick={async () => {
              setError('');
              const err = await signInWithGoogle();
              if (err) setError('Google Sign-In ยังไม่พร้อมใช้งาน — กรุณาใช้อีเมล/รหัสผ่านแทน');
            }}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors press-sm mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            ดำเนินการด้วย Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">หรือใช้อีเมล</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ชื่อที่แสดง"
                className="input-field w-full"
                required
              />
            )}
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="อีเมล"
              className="input-field w-full"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                className="input-field w-full pr-10"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-3 py-2.5 rounded-xl animate-fadeUp">
                <span className="material-symbols-outlined text-sm mt-0.5 flex-shrink-0">error</span>
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 bg-green-50 border border-green-100 text-green-700 text-sm px-3 py-2.5 rounded-xl animate-fadeUp">
                <span className="material-symbols-outlined text-sm mt-0.5 flex-shrink-0">check_circle</span>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังดำเนินการ...
                </span>
              ) : tab === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          ใช้งานได้โดยไม่ต้องเข้าสู่ระบบ —{' '}
          <button onClick={() => navigate('/')} className="text-primary-500 font-semibold underline underline-offset-2">
            ข้ามไปก่อน
          </button>
        </p>
      </div>
    </div>
  );
}
