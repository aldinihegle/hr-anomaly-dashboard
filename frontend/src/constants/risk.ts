import type { RiskCategory } from '../types';

export const RISK_COLOR: Record<RiskCategory, string> = {
  rendah: '#12b76a', // success-500
  sedang: '#f79009', // warning-500
  tinggi: '#f04438', // error-500
};

// Label ringkas untuk badge & filter
export const RISK_LABEL: Record<RiskCategory, string> = {
  rendah: 'Perhatian Rendah',
  sedang: 'Perhatian Sedang',
  tinggi: 'Perhatian Tinggi',
};

// Deskripsi lengkap untuk narasi / tooltip
export const RISK_DESC: Record<RiskCategory, string> = {
  rendah: 'Profil relatif umum dibandingkan populasi data — tidak ada kombinasi atribut yang mencolok.',
  sedang: 'Terdapat beberapa kombinasi atribut yang tidak biasa — profil layak dipantau lebih lanjut.',
  tinggi: 'Profil termasuk kelompok paling tidak lazim — disarankan ditinjau oleh HR.',
};
