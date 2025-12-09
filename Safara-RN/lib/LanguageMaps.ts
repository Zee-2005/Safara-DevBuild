// src/utils/languageMaps.ts
export type IndicLanguageCode =
  | 'hi' | 'bn' | 'te' | 'mr' | 'ta' | 'gu' | 'kn' | 'ml'
  | 'or' | 'pa' | 'as' | 'ur' | 'sa' | 'ks' | 'sd' | 'ne'
  | 'gom' | 'mni' | 'doi' | 'brx' | 'sat' | 'mai' | 'en';

export interface IndicLanguageMeta {
  name: string;
  english: string;
  script: string;
}

export const INDIC_LANGUAGES: Record<IndicLanguageCode, IndicLanguageMeta> = {
  hi: { name: 'हिंदी', english: 'Hindi', script: 'Devanagari' },
  bn: { name: 'বাংলা', english: 'Bengali', script: 'Bengali' },
  te: { name: 'తెలుగు', english: 'Telugu', script: 'Telugu' },
  mr: { name: 'मराठी', english: 'Marathi', script: 'Devanagari' },
  ta: { name: 'தமிழ்', english: 'Tamil', script: 'Tamil' },
  gu: { name: 'ગુજરાતી', english: 'Gujarati', script: 'Gujarati' },
  kn: { name: 'ಕನ್ನಡ', english: 'Kannada', script: 'Kannada' },
  ml: { name: 'മലയാളം', english: 'Malayalam', script: 'Malayalam' },
  or: { name: 'ଓଡ଼ିଆ', english: 'Odia', script: 'Odia' },
  pa: { name: 'ਪੰਜਾਬੀ', english: 'Punjabi', script: 'Gurmukhi' },
  as: { name: 'অসমীয়া', english: 'Assamese', script: 'Bengali' },
  ur: { name: 'اردو', english: 'Urdu', script: 'Urdu' },
  sa: { name: 'संस्कृत', english: 'Sanskrit', script: 'Devanagari' },
  ks: { name: 'کٲشُر', english: 'Kashmiri', script: 'Perso-Arabic' },
  sd: { name: 'سنڌي', english: 'Sindhi', script: 'Perso-Arabic' },
  ne: { name: 'नेपाली', english: 'Nepali', script: 'Devanagari' },
  gom: { name: 'कोंकणी', english: 'Konkani', script: 'Devanagari' },
  mni: { name: 'মৈতৈলোন্', english: 'Manipuri', script: 'Meitei Mayek' },
  doi: { name: 'डोगरी', english: 'Dogri', script: 'Devanagari' },
  brx: { name: 'बड़ो', english: 'Bodo', script: 'Devanagari' },
  sat: { name: 'ᱥᱟᱱᱛᱟᱲᱤ', english: 'Santali', script: 'Ol Chiki' },
  mai: { name: 'मैथिली', english: 'Maithili', script: 'Devanagari' },
  en: { name: 'English', english: 'English', script: 'Latin' },
};

export const STATE_LANGUAGES: Record<string, IndicLanguageCode[]> = {
  Delhi: ['hi', 'en'],
  Punjab: ['pa', 'hi', 'en'],
  Haryana: ['hi', 'en'],
  Rajasthan: ['hi', 'en'],
  'Uttar Pradesh': ['hi', 'en'],
  Uttarakhand: ['hi', 'en'],
  'Himachal Pradesh': ['hi', 'en'],
  'Jammu and Kashmir': ['ks', 'ur', 'hi', 'en'],
  Ladakh: ['ur', 'hi', 'en'],

  Karnataka: ['kn', 'en'],
  'Tamil Nadu': ['ta', 'en'],
  Kerala: ['ml', 'en'],
  'Andhra Pradesh': ['te', 'en'],
  Telangana: ['te', 'ur', 'en'],
  Puducherry: ['ta', 'en'],
  Lakshadweep: ['ml', 'en'],
  'Andaman and Nicobar Islands': ['hi', 'en'],

  'West Bengal': ['bn', 'en'],
  Odisha: ['or', 'en'],
  Bihar: ['hi', 'mai', 'en'],
  Jharkhand: ['hi', 'sat', 'en'],
  Assam: ['as', 'bn', 'en'],
  Manipur: ['mni', 'en'],
  Meghalaya: ['en'],
  Tripura: ['bn', 'en'],
  Nagaland: ['en'],
  Mizoram: ['en'],
  'Arunachal Pradesh': ['en'],
  Sikkim: ['ne', 'hi', 'en'],

  Maharashtra: ['mr', 'hi', 'en'],
  Gujarat: ['gu', 'hi', 'en'],
  Goa: ['gom', 'mr', 'en'],
  'Dadra and Nagar Haveli': ['gu', 'hi', 'en'],
  'Daman and Diu': ['gu', 'hi', 'en'],

  'Madhya Pradesh': ['hi', 'en'],
  Chhattisgarh: ['hi', 'en'],
};