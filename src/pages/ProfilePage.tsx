import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { safescanSelect, safescanUpdate, type NotifPrefsRow } from '../lib/supabase';
import { useScanHistory } from '../hooks/useScanHistory';
import { useFavorites } from '../hooks/useFavorites';
import { gradeTextColor, timeAgo, getGradeConfig } from '../lib/utils';
import { calculateLevel, getProgressToNextLevel } from '../lib/gamification';
import { HEALTH_GOALS } from '../lib/healthGoals';
import { AchievementsSection } from '../components/AchievementsSection';

const ALLERGY_LIST = ['กลูเตน', 'นม', 'ไข่', 'ถั่วเหลือง', 'ถั่ว', 'อาหารทะเล', 'น้ำมันงา', 'ซัลไฟต์'];

export function ProfilePage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { showToast } = useToast();
  const { history }   = useScanHistory();
  const { favorites } = useFavorites();
  const navigate      = useNavigate();

  const [editName, setEditName] = useState(false);
  const [name, setName]         = useState('');
  const [prefs, setPrefs]       = useState<NotifPrefsRow | null>(null);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    setName(profile?.display_name ?? user?.user_metadata?.full_name ?? 'ผู้ใช้งาน SafeScan');
  }, [profile, user]);

  useEffect(() => {
    if (!user) return;
    safescanSelect<NotifPrefsRow>('notification_prefs', '*', { user_id: user.id })
      .then(data => setPrefs(data?.[0] ?? null));
  }, [user]);

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) { showToast('กรุณากรอกชื่อ', 'error'); return; }
    if (trimmed.length > 50) { showToast('ชื่อต้องไม่เกิน 50 ตัวอักษร', 'error'); return; }
    // Strip HTML/script tags to prevent XSS stored in profile
    const sanitized = trimmed.replace(/<[^>]*>/g, '').replace(/[<>"']/g, '');
    if (!sanitized) { showToast('ชื่อไม่ถูกต้อง', 'error'); return; }
    setSaving(true);
    try {
      await updateProfile({ display_name: sanitized });
      showToast('บันทึกชื่อเรียบร้อย', 'success');
      setEditName(false);
    } catch {
      showToast('บันทึกไม่สำเร็จ กรุณาลองใหม่', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleAllergy = async (a: string) => {
    if (!profile) return;
    const current = profile.allergens ?? [];
    const next    = current.includes(a) ? current.filter(x => x !== a) : [...current, a];
    await updateProfile({ allergens: next });
  };

  const togglePref = async (key: keyof Omit<NotifPrefsRow, 'user_id' | 'updated_at'>) => {
    if (!user || !prefs) return;
    const prev = { ...prefs };
    const next = { ...prefs, [key]: !prefs[key], updated_at: new Date().toISOString() };
    setPrefs(next);
    const result = await safescanUpdate('notification_prefs', next, { user_id: user.id });
    if (!result) {
      setPrefs(prev);
      showToast('บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่', 'error');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // ── Computed stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const gradeCount: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    let scoreSum = 0;
    let scoreCount = 0;

    for (const h of history) {
      const g = h.safety_grade?.toUpperCase();
      if (g && g in gradeCount) gradeCount[g]++;
      if (h.safety_score !== null) { scoreSum += h.safety_score; scoreCount++; }
    }

    const avgScore   = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : null;
    const maxCount   = Math.max(1, ...Object.values(gradeCount));
    const riskCount  = gradeCount['D'] + gradeCount['E'];
    const safeCount  = gradeCount['A'] + gradeCount['B'];

    return { gradeCount, avgScore, maxCount, riskCount, safeCount };
  }, [history]);


  const avatarLetter = (profile?.display_name ?? user?.email ?? 'S')[0].toUpperCase();
  const allergens    = profile?.allergens ?? [];
  
  const healthGoals  = profile?.health_goals ?? [];
  const points = profile?.points ?? 0;
  const currentLevel = calculateLevel(points);
  const progress = getProgressToNextLevel(points).percent;

  const toggleHealthGoal = async (g: string) => {
    if (!profile) return;
    const current = profile.health_goals ?? [];
    const next = current.includes(g) ? current.filter(x => x !== g) : [...current, g];
    await updateProfile({ health_goals: next });
  };

  return (
    <div className="flex flex-col pb-28 md:pb-8">
      <header className="glassmorphism md:bg-transparent sticky top-0 z-40 px-5 md:px-8 pt-10 md:pt-8 pb-4 border-b border-primary-50 md:border-none">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">โปรไฟล์</h1>
        <p className="text-sm text-gray-400">จัดการบัญชีและการตั้งค่า</p>
      </header>

      <div className="px-5 md:px-8 pt-6">
        {!user ? (
          /* ── Guest state ── */
          <div className="card p-10 text-center animate-fadeUp">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-gray-300 text-4xl">person</span>
            </div>
            <h2 className="font-bold text-lg text-gray-800 mb-1">ยังไม่ได้เข้าสู่ระบบ</h2>
            <p className="text-sm text-gray-400 mb-6">เข้าสู่ระบบเพื่อบันทึกประวัติ รายการโปรด และตั้งค่าการแพ้อาหาร</p>
            <Link to="/login" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
              <span className="material-symbols-outlined text-sm">login</span>
              เข้าสู่ระบบ / สมัครสมาชิก
            </Link>
          </div>
        ) : (
          <div className="md:grid md:grid-cols-2 md:gap-8 space-y-6 md:space-y-0">

            {/* ── LEFT ── */}
            <div className="space-y-6">

              {/* Profile Card */}
              <div className="card p-6 animate-fadeUp">
                <div className="flex items-center gap-4 mb-5">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="avatar" className="w-16 h-16 rounded-full object-cover shadow-card" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-card flex-shrink-0">
                      <span className="text-white text-2xl font-black">{avatarLetter}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {editName ? (
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onBlur={saveName}
                        onKeyDown={e => e.key === 'Enter' && saveName()}
                        autoFocus
                        disabled={saving}
                        className="font-bold text-lg text-gray-900 border-b-2 border-primary-400 outline-none w-full bg-transparent disabled:opacity-50"
                      />
                    ) : (
                      <button onClick={() => setEditName(true)} className="flex items-center gap-1.5 group text-left">
                        <h2 className="font-bold text-lg text-gray-900 truncate">{name}</h2>
                        <span className="material-symbols-outlined text-gray-300 text-sm group-hover:text-primary-500 transition-colors flex-shrink-0">edit</span>
                      </button>
                    )}
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>

                {/* Level & Points */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">เลเวล {currentLevel}</span>
                    <span className="text-xs text-gray-500">{points} แต้มสะสม</span>
                  </div>
                  <div className="flex-1 ml-4 mr-2">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-[10px] text-primary-600 text-right mt-1 font-medium">{progress}% ไปยังเลเวลถัดไป</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-primary-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-primary-600">{profile?.scan_count ?? history.length}</div>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">สแกนแล้ว</p>
                  </div>
                  <div className="bg-pink-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-pink-500">{favorites.length}</div>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">รายการโปรด</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-green-600">{stats.safeCount}</div>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">สินค้าปลอดภัย</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-red-500">{stats.riskCount}</div>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">ควรระวัง</p>
                  </div>
                </div>
              </div>

              {/* Safety Grade Analytics */}
              {history.length > 0 && (
                <div className="card p-5 animate-fadeUp delay-75">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary-500 text-xl">bar_chart</span>
                      สถิติระดับความปลอดภัย
                    </h2>
                    {stats.avgScore !== null && (
                      <div className="text-right">
                        <span className={`text-2xl font-black ${gradeTextColor(stats.avgScore)}`}>
                          {stats.avgScore}
                        </span>
                        <p className="text-[10px] text-gray-400 leading-tight">คะแนนเฉลี่ย</p>
                      </div>
                    )}
                  </div>

                  {/* Grade distribution bars */}
                  <div className="space-y-2">
                    {(['A','B','C','D','E'] as const).map(grade => {
                      const cfg   = getGradeConfig(grade);
                      const count = stats.gradeCount[grade];
                      const pct   = Math.round((count / stats.maxCount) * 100);
                      return (
                        <div key={grade} className="flex items-center gap-3">
                          {/* Grade badge */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                            <span className={`text-xs font-black ${cfg.text}`}>{grade}</span>
                          </div>
                          {/* Bar */}
                          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${cfg.bar}`}
                              style={{ width: count > 0 ? `${Math.max(pct, 4)}%` : '0%' }}
                            />
                          </div>
                          {/* Count */}
                          <div className="w-14 text-right">
                            <span className={`text-xs font-bold ${count > 0 ? cfg.text : 'text-gray-300'}`}>
                              {count > 0 ? count : '–'}
                            </span>
                            {count > 0 && (
                              <span className="text-[10px] text-gray-400 ml-0.5">
                                ({Math.round((count / history.length) * 100)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary insight */}
                  {stats.avgScore !== null && (
                    <p className={`text-xs mt-3 pt-3 border-t border-gray-100 ${
                      stats.avgScore >= 70 ? 'text-green-600' :
                      stats.avgScore >= 55 ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {stats.avgScore >= 70
                        ? `สินค้าที่คุณสแกนส่วนใหญ่มีความปลอดภัยดี — คะแนนเฉลี่ย ${stats.avgScore}/100`
                        : stats.avgScore >= 55
                        ? `คะแนนเฉลี่ย ${stats.avgScore}/100 — ลองมองหาทางเลือกที่ดีกว่า`
                        : `คะแนนเฉลี่ยต่ำ (${stats.avgScore}/100) — ควรตรวจสอบรายการสแกนล่าสุด`
                      }
                    </p>
                  )}
                </div>
              )}

              {/* Health Goals */}
              <div className="card p-5 animate-fadeUp delay-100">
                <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500">health_and_safety</span>
                  เป้าหมายสุขภาพ (ปรับแต่งคะแนน)
                </h2>
                <p className="text-xs text-gray-400 mb-3">คะแนนความปลอดภัยจะถูกคำนวณใหม่ให้เหมาะกับเป้าหมายของคุณ</p>
                <div className="flex flex-wrap gap-2">
                  {HEALTH_GOALS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => toggleHealthGoal(g.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all press-sm ${
                        healthGoals.includes(g.id)
                          ? 'bg-green-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                      }`}
                      title={g.description}
                    >
                      {healthGoals.includes(g.id) && '✓ '}{g.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergy Profile */}
              <div className="card p-5 animate-fadeUp delay-100">
                <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500">warning</span>
                  โปรไฟล์การแพ้ / ข้อจำกัดอาหาร
                </h2>
                <p className="text-xs text-gray-400 mb-3">ระบบจะเตือนเมื่อพบส่วนผสมที่คุณแพ้ — บันทึกอัตโนมัติ</p>
                <div className="flex flex-wrap gap-2">
                  {ALLERGY_LIST.map(a => (
                    <button
                      key={a}
                      onClick={() => toggleAllergy(a)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all press-sm ${
                        allergens.includes(a)
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      {allergens.includes(a) && '✓ '}{a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Achievements Section with Medal, Level, and Badges */}
              <AchievementsSection
                points={points}
                scanCount={profile?.scan_count ?? history.length}
                profile={profile}
              />

              {/* App Info */}
              <div className="text-center py-2 hidden md:block">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-primary-400 text-sm">verified</span>
                  <span className="font-bold text-primary-600 text-sm">SafeScan AI</span>
                </div>
                <p className="text-xs text-gray-400">เวอร์ชัน 2.0.0 · ข้อมูลจาก Open Food Facts + Supabase</p>
              </div>
            </div>

            {/* ── RIGHT ── */}
            <div className="space-y-6">

              {/* Recent Scans Mini List */}
              {history.length > 0 && (
                <div className="card p-5 animate-fadeUp delay-100">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary-500 text-xl">history</span>
                      สแกนล่าสุด
                    </h2>
                    <Link to="/history" className="text-xs text-primary-500 font-semibold hover:text-primary-700 transition-colors">
                      ดูทั้งหมด
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {history.slice(0, 5).map((h, i) => {
                      const grade = h.safety_grade?.toUpperCase() ?? '?';
                      const cfg   = getGradeConfig(grade);
                      return (
                        <div key={h.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors" style={{ animationDelay: `${i * 50}ms` }}>
                          {h.product_image ? (
                            <img src={h.product_image} alt={h.product_name ?? ''} className="w-9 h-9 rounded-lg object-contain bg-gray-50 flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-gray-300 text-lg">image_not_supported</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{h.product_name ?? 'ไม่ทราบชื่อ'}</p>
                            <p className="text-xs text-gray-400">{h.product_brand ?? ''} · {timeAgo(h.scanned_at)}</p>
                          </div>
                          {grade !== '?' && (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                              <span className={`text-sm font-black ${cfg.text}`}>{grade}</span>
                            </div>
                          )}
                          {h.safety_score !== null && (
                            <span className={`text-sm font-bold flex-shrink-0 ${gradeTextColor(h.safety_score ?? 0)}`}>
                              {h.safety_score}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {prefs && (
                <div className="card p-5 animate-fadeUp delay-150">
                  <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-500">notifications</span>
                    การแจ้งเตือน
                  </h2>
                  <div className="space-y-4">
                    {([
                      { key: 'alerts_enabled',    label: 'แจ้งเตือนสินค้าอันตราย / ถูกแบน',     icon: 'notifications_active' },
                      { key: 'nutrition_enabled', label: 'แสดงข้อมูลโภชนาการโดยละเอียด',          icon: 'nutrition' },
                      { key: 'history_enabled',   label: 'บันทึกประวัติการสแกนอัตโนมัติ',          icon: 'history' },
                    ] as const).map(s => (
                      <div key={s.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary-500 text-sm">{s.icon}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{s.label}</span>
                        </div>
                        <button
                          onClick={() => togglePref(s.key)}
                          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${prefs[s.key] ? 'bg-primary-500' : 'bg-gray-200'}`}
                          aria-label={s.label}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${prefs[s.key] ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="card p-5 animate-fadeUp delay-200">
                <h2 className="font-bold text-gray-800 mb-3">บัญชีและข้อมูล</h2>
                <div className="space-y-1">
                  {[
                    { icon: 'history',       label: 'ประวัติการสแกนทั้งหมด', to: '/history'   },
                    { icon: 'favorite',      label: 'รายการโปรดของฉัน',     to: '/favorites' },
                    { icon: 'shopping_cart', label: 'ตะกร้าสินค้า',         to: '/cart'      },
                  ].map(item => (
                    <Link
                      key={item.icon}
                      to={item.to}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400 text-xl">{item.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      <span className="material-symbols-outlined text-gray-300 text-sm">chevron_right</span>
                    </Link>
                  ))}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-red-400 text-xl">logout</span>
                    <span className="text-sm font-medium text-red-500">ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile App Info */}
        {user && (
          <div className="text-center py-6 md:hidden">
            <p className="text-xs text-gray-400">เวอร์ชัน 2.0.0 · SafeScan AI · Supabase</p>
          </div>
        )}
      </div>
    </div>
  );
}
