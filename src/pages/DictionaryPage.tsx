import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ADDITIVE_DB, INGREDIENT_DB } from '../lib/ingredientDatabase';

type FilterType = 'all' | 'additives' | 'ingredients';

const SEVERITY_COLORS = {
  safe:    'bg-green-100 text-green-700 border-green-200',
  caution: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  risk:    'bg-red-100 text-red-700 border-red-200',
};
const SEVERITY_LABELS = {
  safe:    'ปลอดภัย',
  caution: 'เฝ้าระวัง',
  risk:    'มีความเสี่ยง',
};

export function DictionaryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== searchTerm) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (val) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const additiveList = useMemo(() => {
    return Object.entries(ADDITIVE_DB).map(([code, data]) => ({
      id: code,
      name: `${code} - ${data.name}`,
      function: data.function,
      severity: data.severity,
      description: data.description,
      type: 'additives',
    }));
  }, []);

  const ingredientList = useMemo(() => {
    return Object.entries(INGREDIENT_DB).map(([name, data]) => ({
      id: name,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      function: data.function,
      severity: data.status,
      description: data.description,
      type: 'ingredients',
    }));
  }, []);

  const combinedList = useMemo(() => {
    let list = [...additiveList, ...ingredientList];
    if (filter === 'additives') list = additiveList;
    if (filter === 'ingredients') list = ingredientList;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(lower) || 
        item.function.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower)
      );
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [additiveList, ingredientList, filter, searchTerm]);

  return (
    <div className="min-h-[calc(100vh-4rem)] md:min-h-screen p-4 pb-24 md:p-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
          <span className="material-symbols-outlined text-primary-500 text-3xl">menu_book</span>
          พจนานุกรมส่วนผสม
        </h1>
        <p className="text-sm md:text-base text-gray-500 mt-2 font-medium">ค้นหาข้อมูล E-Number และสารเคมีกว่าร้อยชนิด</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-gray-400">search</span>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="ค้นหาส่วนผสม เช่น E102, Aspartame, Paraben..."
          className="w-full pl-11 pr-4 py-3 bg-white border-2 border-primary-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50 transition-all shadow-sm"
        />
        {searchTerm && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'all', label: 'ทั้งหมด' },
          { id: 'additives', label: 'สารเติมแต่ง (E-Numbers)' },
          { id: 'ingredients', label: 'ส่วนผสมทั่วไป' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterType)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border-2
              ${filter === tab.id 
                ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm' 
                : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="bg-white rounded-3xl p-2 md:p-6 shadow-card border border-primary-50/50">
        <div className="flex items-center justify-between px-4 py-3 mb-2 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">พบ {combinedList.length} รายการ</p>
        </div>
        
        {combinedList.length > 0 ? (
          <div className="space-y-3">
            {combinedList.map((item, index) => (
              <div 
                key={item.id} 
                className="p-4 rounded-2xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all duration-200 animate-fadeUp"
                style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      {item.name}
                      {item.type === 'additives' && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] uppercase font-bold border border-blue-100">
                          E-Number
                        </span>
                      )}
                    </h3>
                    <p className="text-sm font-medium text-primary-600">{item.function}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.safe}`}>
                      {SEVERITY_LABELS[item.severity] || SEVERITY_LABELS.safe}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 animate-scaleIn">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <span className="material-symbols-outlined text-gray-300 text-4xl">search_off</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">ไม่พบรายการที่ค้นหา</h3>
            <p className="text-gray-500 text-sm">ลองเปลี่ยนคำค้นหาเป็นชื่อภาษาอังกฤษ หรือหมายเลข E-Number (เช่น E100, E951)</p>
          </div>
        )}
      </div>
    </div>
  );
}
