import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ALLERGY_LIST = ['กลูเตน', 'นม', 'ไข่', 'ถั่วเหลือง', 'ถั่ว', 'อาหารทะเล', 'น้ำมันงา', 'ซัลไฟต์'];

interface Props {
  onClose: () => void;
}

export function OnboardingModal({ onClose }: Props) {
  const { updateProfile } = useAuth();
  const { showToast }     = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving]     = useState(false);

  const toggle = (a: string) =>
    setSelected(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ allergens: selected });
    showToast('ตั้งค่าโปรไฟล์เรียบร้อยแล้ว', 'success');
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 mx-auto mb-4">
          <span className="material-symbols-outlined text-primary-500 text-3xl">health_and_safety</span>
        </div>
        <h2 className="text-xl font-black text-gray-900 text-center mb-1">ยินดีต้อนรับ!</h2>
        <p className="text-sm text-gray-400 text-center mb-5">
          ตั้งค่าการแพ้อาหารของคุณเพื่อรับการแจ้งเตือนที่แม่นยำ
        </p>

        {/* Allergy chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ALLERGY_LIST.map(a => (
            <button
              key={a}
              onClick={() => toggle(a)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border press-effect ${
                selected.includes(a)
                  ? 'bg-red-500 text-white border-red-500 shadow-md'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-red-300'
              }`}
            >
              {selected.includes(a) && (
                <span className="material-symbols-outlined text-xs mr-1 align-middle">check</span>
              )}
              {a}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            ข้ามไปก่อน
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl btn-primary text-sm font-semibold flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-sm">check</span>
            )}
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
