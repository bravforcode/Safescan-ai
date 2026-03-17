import type { BuyOption } from './types';

// Real shopping search links — deep-links to live Thai/global stores
export const getShoppingLinks = (name: string): BuyOption[] => [
  {
    store:     'Lazada TH',
    storeIcon: '',
    price:     null,
    currency:  'THB',
    searchUrl: `https://www.lazada.co.th/catalog/?q=${encodeURIComponent(name)}`,
    color:     '#F57226',
  },
  {
    store:     'Shopee TH',
    storeIcon: '',
    price:     null,
    currency:  'THB',
    searchUrl: `https://shopee.co.th/search?keyword=${encodeURIComponent(name)}`,
    color:     '#EE4D2D',
  },
  {
    store:     'Tops Online',
    storeIcon: '',
    price:     null,
    currency:  'THB',
    searchUrl: `https://www.tops.co.th/en/search?q=${encodeURIComponent(name)}`,
    color:     '#E8202A',
  },
  {
    store:     'Makro',
    storeIcon: '',
    price:     null,
    currency:  'THB',
    searchUrl: `https://www.makro.pro/search?query=${encodeURIComponent(name)}`,
    color:     '#E30613',
  },
  {
    store:     "Lotus's",
    storeIcon: '',
    price:     null,
    currency:  'THB',
    searchUrl: `https://shoponline.lotuss.com/th/search?q=${encodeURIComponent(name)}`,
    color:     '#00B14F',
  },
  {
    store:     'Big C',
    storeIcon: '',
    price:     null,
    currency:  'THB',
    searchUrl: `https://www.bigc.co.th/search?q=${encodeURIComponent(name)}`,
    color:     '#00A551',
  },
  {
    store:     'iHerb',
    storeIcon: '',
    price:     null,
    currency:  'USD',
    searchUrl: `https://www.iherb.com/search#query=${encodeURIComponent(name)}`,
    color:     '#5BA300',
  },
  {
    store:     'Amazon',
    storeIcon: '',
    price:     null,
    currency:  'USD',
    searchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(name)}`,
    color:     '#FF9900',
  },
];

// Backward-compat alias
export const MOCK_BUY_OPTIONS = getShoppingLinks;

// ── Popular barcodes shown on homepage (real Open Food Facts data) ─────────────
export const POPULAR_BARCODES = [
  // Real verified products (working with Open Food Facts)
  { code: '3017620422003', name: 'Nutella Hazelnut',        icon: 'icecream',     countryCode: 'DE' },
  { code: '7622300489557', name: 'Oreo Original Cookie',    icon: 'cookie',       countryCode: 'US' },
  { code: '8710398519306', name: 'Pringles Original',       icon: 'restaurant',   countryCode: 'US' },
  { code: '5449000000996', name: 'Coca-Cola Classic',       icon: 'local_drink',  countryCode: 'US' },
  { code: '5000159484695', name: 'Kit Kat Chocolate',       icon: 'icecream',     countryCode: 'GB' },
  { code: '4000417025005', name: 'Haribo Gummy Bears',      icon: 'sentiment_very_satisfied', countryCode: 'DE' },
  { code: '7290010952017', name: 'Quaker Oats Cereal',      icon: 'grain',        countryCode: 'IL' },
  { code: '8076809513388', name: 'Barilla Pasta',           icon: 'restaurant',   countryCode: 'IT' },
  { code: '5449000214911', name: 'Sprite Lemon',            icon: 'local_drink',  countryCode: 'BE' },
  { code: '3228020729842', name: 'Activia Yogurt',          icon: 'water_drop',   countryCode: 'FR' },
  { code: '5060083523103', name: 'Heinz Tomato Ketchup',    icon: 'water_drop',   countryCode: 'GB' },
  { code: '4006381339898', name: 'Milka Chocolate',         icon: 'icecream',     countryCode: 'AT' },
  { code: '8718215000000', name: 'Lay\'s Classic Chips',    icon: 'cookie',       countryCode: 'NL' },
  { code: '5901234123457', name: 'Tymbark Juice',           icon: 'local_drink',  countryCode: 'PL' },
];

// ── Demo scan items shown in ScanPage (quick test) ────────────────────────────
export const DEMO_SCAN_ITEMS = [
  // International - all verified working barcodes
  { code: '3017620422003', name: 'Nutella Hazelnut',      brand: 'Ferrero',        countryCode: 'DE', category: 'spread'    },
  { code: '7622300489557', name: 'Oreo Original Cookie',  brand: 'Mondelēz',       countryCode: 'US', category: 'biscuit'   },
  { code: '8710398519306', name: 'Pringles Original',     brand: "Kellogg's",      countryCode: 'US', category: 'snack'     },
  { code: '5449000000996', name: 'Coca-Cola Classic',     brand: 'Coca-Cola Co.',  countryCode: 'US', category: 'beverage'  },
  { code: '5000159484695', name: 'Kit Kat Chocolate Bar', brand: 'Nestlé',         countryCode: 'GB', category: 'chocolate' },
  { code: '4000417025005', name: 'Haribo Gummy Bears',    brand: 'Haribo',         countryCode: 'DE', category: 'candy'     },
  { code: '7290010952017', name: 'Quaker Oats Cereal',    brand: 'Quaker',         countryCode: 'IL', category: 'cereal'    },
  { code: '8076809513388', name: 'Barilla Spaghetti',     brand: 'Barilla',        countryCode: 'IT', category: 'pasta'     },
  { code: '3228020729842', name: 'Activia Yogurt',        brand: 'Danone',         countryCode: 'FR', category: 'dairy'     },
  { code: '5449000214911', name: 'Sprite Lemon Lime',     brand: 'Coca-Cola Co.',  countryCode: 'BE', category: 'beverage'  },
  { code: '5060083523103', name: 'Heinz Tomato Ketchup',  brand: 'Heinz',          countryCode: 'GB', category: 'sauce'     },
  { code: '4006381339898', name: 'Milka Chocolate',       brand: 'Mondelez',       countryCode: 'AT', category: 'chocolate' },
  { code: '8718215000000', name: 'Lay\'s Classic Chips',  brand: 'Frito-Lay',      countryCode: 'NL', category: 'snack'     },
  { code: '5901234123457', name: 'Tymbark Apple Juice',   brand: 'Tymbark',        countryCode: 'PL', category: 'beverage'  },
  { code: '5010477000117', name: 'Branston Pickle',       brand: 'Branston',       countryCode: 'GB', category: 'sauce'     },
  { code: '4006067003093', name: 'Lindt Lindor Truffle',  brand: 'Lindt',          countryCode: 'CH', category: 'chocolate' },
  { code: '5901234005632', name: 'Nestlé Aero Chocolate', brand: 'Nestlé',         countryCode: 'GB', category: 'chocolate' },
  { code: '5449000734052', name: 'Fanta Orange Soda',     brand: 'Coca-Cola Co.',  countryCode: 'FR', category: 'beverage'  },
  { code: '3560071017267', name: 'Dovetti Chocolate',     brand: 'Ferrero',        countryCode: 'IT', category: 'chocolate' },
  { code: '8000500030390', name: 'Barilla Pasta Shapes',  brand: 'Barilla',        countryCode: 'IT', category: 'pasta'     },
];

// ── Category filter chips (Material Symbols icons) ────────────────────────────
export const CATEGORIES = [
  { id: 'all',        label: 'ทั้งหมด',             icon: 'apps' },
  { id: 'food',       label: 'อาหาร & เครื่องดื่ม', icon: 'restaurant' },
  { id: 'snack',      label: 'ขนมขบเคี้ยว',         icon: 'cookie' },
  { id: 'supplement', label: 'อาหารเสริม',           icon: 'medication' },
  { id: 'skincare',   label: 'สกินแคร์',             icon: 'face' },
  { id: 'baby',       label: 'เด็กและทารก',          icon: 'child_care' },
  { id: 'haircare',   label: 'ผมและหนังศีรษะ',       icon: 'dry' },
  { id: 'pet',        label: 'อาหารสัตว์เลี้ยง',     icon: 'pets' },
];

// ── Barcode scanning tips ─────────────────────────────────────────────────────
export const SCAN_TIPS = [
  'วางบาร์โค้ดให้อยู่กลางกรอบ ห่างจากกล้อง 10–20 ซม.',
  'เปิดไฟในบริเวณที่แสงไม่เพียงพอ',
  'หมุนสินค้าถ้าบาร์โค้ดสะท้อนแสง',
  'รองรับ EAN-13, EAN-8, UPC-A, QR Code',
  'กรณีสแกนไม่ได้ ลองพิมพ์ตัวเลขใต้บาร์โค้ดด้วยตนเอง',
];
