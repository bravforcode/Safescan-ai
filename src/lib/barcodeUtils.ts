/** Barcode type detection and GS1 country prefix mapping */

export type BarcodeType = 'EAN-13' | 'EAN-8' | 'UPC-A' | 'UPC-E' | 'ITF-14' | 'QR' | 'DATA_MATRIX' | 'UNKNOWN';

/** Detect barcode type from its length and structure */
export function detectBarcodeType(barcode: string): BarcodeType {
  const clean = barcode.replace(/\s/g, '');
  if (!/^\d+$/.test(clean)) return 'UNKNOWN';

  switch (clean.length) {
    case 8:  return 'EAN-8';
    case 12: return 'UPC-A';
    case 13: return 'EAN-13';
    case 6:  return 'UPC-E';
    case 14: return 'ITF-14';
    default: return 'UNKNOWN';
  }
}

/** EAN-13 checksum validation (Luhn-style mod-10) */
export function validateEAN13(barcode: string): boolean {
  if (barcode.length !== 13 || !/^\d{13}$/.test(barcode)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(barcode[i], 10);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(barcode[12], 10);
}

/** UPC-A checksum validation */
export function validateUPCA(barcode: string): boolean {
  if (barcode.length !== 12 || !/^\d{12}$/.test(barcode)) return false;
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const d = parseInt(barcode[i], 10);
    sum += i % 2 === 0 ? d * 3 : d;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(barcode[11], 10);
}

/** Convert UPC-A to EAN-13 by prepending 0 */
export function upcAtoEAN13(upc: string): string {
  return '0' + upc;
}

// ── GS1 Country Prefix Map ───────────────────────────────────────────────────
// Source: GS1 General Specifications, January 2024
const GS1_PREFIXES: Array<[number, number, string]> = [
  [0,   19,  'United States'],
  [20,  29,  'In-store/internal use'],
  [30,  37,  'France'],
  [380, 380, 'Bulgaria'],
  [383, 383, 'Slovenia'],
  [385, 385, 'Croatia'],
  [387, 387, 'Bosnia-Herzegovina'],
  [389, 389, 'Montenegro'],
  [40,  44,  'Germany'],
  [45,  45,  'Japan'],
  [46,  46,  'Russian Federation'],
  [470, 470, 'Kyrgyzstan'],
  [471, 471, 'Taiwan'],
  [474, 474, 'Estonia'],
  [475, 475, 'Latvia'],
  [476, 476, 'Azerbaijan'],
  [477, 477, 'Lithuania'],
  [478, 478, 'Uzbekistan'],
  [479, 479, 'Sri Lanka'],
  [480, 480, 'Philippines'],
  [481, 481, 'Belarus'],
  [482, 482, 'Ukraine'],
  [483, 483, 'Turkmenistan'],
  [484, 484, 'Moldova'],
  [485, 485, 'Armenia'],
  [486, 486, 'Georgia'],
  [487, 487, 'Kazakhstan'],
  [488, 488, 'Tajikistan'],
  [489, 489, 'Hong Kong'],
  [49,  49,  'Japan'],
  [50,  50,  'United Kingdom'],
  [520, 521, 'Greece'],
  [528, 528, 'Lebanon'],
  [529, 529, 'Cyprus'],
  [530, 530, 'Albania'],
  [531, 531, 'North Macedonia'],
  [535, 535, 'Malta'],
  [539, 539, 'Ireland'],
  [54,  54,  'Belgium & Luxembourg'],
  [560, 560, 'Portugal'],
  [569, 569, 'Iceland'],
  [57,  57,  'Denmark'],
  [590, 590, 'Poland'],
  [594, 594, 'Romania'],
  [599, 599, 'Hungary'],
  [60,  61,  'South Africa'],
  [619, 619, 'Tunisia'],
  [621, 621, 'Syria'],
  [622, 622, 'Egypt'],
  [624, 624, 'Libya'],
  [625, 625, 'Jordan'],
  [626, 626, 'Iran'],
  [627, 627, 'Kuwait'],
  [628, 628, 'Saudi Arabia'],
  [629, 629, 'United Arab Emirates'],
  [63,  63,  'France (extended)'],
  [640, 649, 'Finland'],
  [690, 695, 'China'],
  [70,  70,  'Norway'],
  [729, 729, 'Israel'],
  [73,  73,  'Sweden'],
  [740, 740, 'Guatemala'],
  [741, 741, 'El Salvador'],
  [742, 742, 'Honduras'],
  [743, 743, 'Nicaragua'],
  [744, 744, 'Costa Rica'],
  [745, 745, 'Panama'],
  [746, 746, 'Dominican Republic'],
  [750, 750, 'Mexico'],
  [754, 755, 'Canada'],
  [759, 759, 'Venezuela'],
  [76,  76,  'Switzerland'],
  [770, 771, 'Colombia'],
  [773, 773, 'Uruguay'],
  [775, 775, 'Peru'],
  [777, 777, 'Bolivia'],
  [778, 779, 'Argentina'],
  [780, 780, 'Chile'],
  [784, 784, 'Paraguay'],
  [786, 786, 'Ecuador'],
  [789, 790, 'Brazil'],
  [80,  83,  'Italy'],
  [84,  84,  'Spain'],
  [850, 850, 'Cuba'],
  [858, 858, 'Slovakia'],
  [859, 859, 'Czech Republic'],
  [860, 860, 'Serbia'],
  [865, 865, 'Mongolia'],
  [867, 867, 'North Korea'],
  [868, 869, 'Turkey'],
  [87,  87,  'Netherlands'],
  [880, 880, 'South Korea'],
  [884, 884, 'Cambodia'],
  [885, 885, 'Thailand'],
  [888, 888, 'Singapore'],
  [890, 890, 'India'],
  [893, 893, 'Vietnam'],
  [896, 896, 'Pakistan'],
  [899, 899, 'Indonesia'],
  [90,  91,  'Austria'],
  [93,  93,  'Australia'],
  [94,  94,  'New Zealand'],
  [955, 955, 'Malaysia'],
  [958, 958, 'Macau'],
  [977, 977, 'Serial publications (ISSN)'],
  [978, 979, 'Books (ISBN)'],
  [980, 980, 'Refund receipts'],
  [981, 984, 'Coupons'],
  [99,  99,  'Coupons'],
];

/** ISO 3166-1 alpha-2 code from country name (replaces emoji flags) */
const COUNTRY_ISO: Record<string, string> = {
  'Thailand':           'TH',
  'United States':      'US',
  'Japan':              'JP',
  'China':              'CN',
  'Germany':            'DE',
  'France':             'FR',
  'United Kingdom':     'GB',
  'South Korea':        'KR',
  'Australia':          'AU',
  'Canada':             'CA',
  'Italy':              'IT',
  'Spain':              'ES',
  'Netherlands':        'NL',
  'Belgium':            'BE',
  'Sweden':             'SE',
  'Finland':            'FI',
  'Norway':             'NO',
  'Denmark':            'DK',
  'Switzerland':        'CH',
  'Austria':            'AT',
  'Poland':             'PL',
  'Brazil':             'BR',
  'Mexico':             'MX',
  'India':              'IN',
  'Indonesia':          'ID',
  'Malaysia':           'MY',
  'Singapore':          'SG',
  'Vietnam':            'VN',
  'Philippines':        'PH',
  'Taiwan':             'TW',
  'Hong Kong':          'HK',
  'New Zealand':        'NZ',
  'Russia':             'RU',
  'Russian Federation': 'RU',
  'Turkey':             'TR',
  'Saudi Arabia':       'SA',
  'Israel':             'IL',
  'South Africa':       'ZA',
  'Egypt':              'EG',
};

/** Look up GS1 country from 3-digit EAN prefix */
function lookupGS1Country(prefix3: number): string | null {
  for (const [lo, hi, country] of GS1_PREFIXES) {
    if (prefix3 >= lo && prefix3 <= hi) return country;
  }
  return null;
}

export interface BarcodeInfo {
  type:           BarcodeType;
  valid:          boolean;
  barcodeCountry: string | null;
  countryCode:    string;   // ISO 3166-1 alpha-2 (replaces emoji flag)
  /** @deprecated use countryCode */
  countryFlag:    string;
  prefix:         string | null;
}

/** Full barcode analysis — type, validity, country of origin */
export function analyzeBarcodeType(barcode: string): BarcodeInfo {
  const clean = barcode.replace(/\s/g, '');
  const type  = detectBarcodeType(clean);

  let valid  = false;
  let prefix: string | null = null;
  let barcodeCountry: string | null = null;

  if (type === 'EAN-13') {
    valid  = validateEAN13(clean);
    prefix = clean.substring(0, 3);
    barcodeCountry = lookupGS1Country(parseInt(prefix, 10));
  } else if (type === 'UPC-A') {
    valid  = validateUPCA(clean);
    prefix = '0' + clean.substring(0, 2);
    barcodeCountry = 'United States';
  } else if (type === 'EAN-8') {
    valid  = true; // simplified
    prefix = clean.substring(0, 2);
    barcodeCountry = lookupGS1Country(parseInt(prefix, 10));
  }

  const countryCode = barcodeCountry ? (COUNTRY_ISO[barcodeCountry] ?? '') : '';

  return { type, valid, barcodeCountry, countryCode, countryFlag: countryCode, prefix };
}
