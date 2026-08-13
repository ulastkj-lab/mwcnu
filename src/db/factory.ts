/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Anggota, AnggotaPendidikan, AnggotaPekerjaan, AnggotaPotensi } from './schema';

// List of realistic Sundanese / Indonesian names for MWC NU Karangpawitan
const FIRST_NAMES_L = ['Asep', 'Dadang', 'Cecep', 'Maman', 'Eman', 'Tatang', 'Wawan', 'Ujang', 'Yudi', 'Heri', 'Dede', 'Encep', 'Hasan', 'Imron', 'Lukman', 'Rahmat', 'Agus', 'Yusuf', 'Iman', 'Endang'];
const LAST_NAMES_L = ['Sutisna', 'Solihin', 'Abdurrahman', 'Sanusi', 'Wahyudin', 'Herdiana', 'Muhyidin', 'Supriadi', 'Rosyadi', 'Saepuloh', 'Gunawan', 'Permana', 'Rustandi', 'Nurjaman', 'Setiawan', 'Hidayat'];

const FIRST_NAMES_P = ['Siti', 'Neng', 'Elis', 'Kokom', 'Suminar', 'Iis', 'Imas', 'Aisyah', 'Komalasari', 'Halimah', 'Aminah', 'Sri', 'Rina', 'Yanti', 'Dewi', 'Kartika', 'Santi', 'Maryam', 'Fitri', 'Nurul'];
const LAST_NAMES_P = ['Rahmawati', 'Sari', 'Indriani', 'Mulyani', 'Lestari', 'Hasanah', 'Wulandari', 'Kamilah', 'Syarifah', 'Fatimah', 'Rochmah', 'Nuraeni', 'Amalia', 'Safitri', 'Agustina', 'Nurjanah'];

const PROFESSIONS = [
  { name: 'Guru / Pendidik', company: 'MA/MTs Maarif Karangpawitan', position: 'Guru Mapel' },
  { name: 'Dosen / Akademisi', company: 'STIT NU Al-Farabi', position: 'Dosen Fiqih' },
  { name: 'Petani / Pekebun', company: 'Kelompok Tani Rukun Warga', position: 'Ketua Kelompok' },
  { name: 'Peternak', company: 'Mandiri', position: 'Pengusaha Ternak Domba' },
  { name: 'Wiraswasta', company: 'Mandiri (Toko Kelontong)', position: 'Pemilik Toko' },
  { name: 'Buruh Harian Lepas', company: 'Sektor Konstruksi', position: 'Pekerja Lapangan' },
  { name: 'PNS / ASN', company: 'KUA Karangpawitan', position: 'Penyuluh Agama' },
  { name: 'Bidan / Perawat', company: 'Puskesmas Karangpawitan', position: 'Perawat Utama' },
  { name: 'Pedagang UMKM', company: 'Kuliner Nusantara', position: 'Owner' }
];

const SCHOOLS = [
  { name: 'UIN Sunan Gunung Djati Bandung', major: 'Pendidikan Agama Islam' },
  { name: 'STIE Siliwangi', major: 'Manajemen Keuangan' },
  { name: 'Universitas Garut (UNIGA)', major: 'Agroteknologi' },
  { name: 'STKIP Garut', major: 'Pendidikan Bahasa Indonesia' },
  { name: 'MA Maarif Karangpawitan', major: 'IPS' },
  { name: 'SMK Negeri 1 Garut', major: 'Teknik Komputer Jaringan' }
];

const PESANTRENS = [
  'Pondok Pesantren Cipasung Tasikmalaya',
  'Pondok Pesantren Al-Falah Biru Tarogong',
  'Pondok Pesantren Godog Karangpawitan',
  'Pondok Pesantren Fauzan Sukaresmi',
  'Pondok Pesantren Lirboyo Kediri',
  'Pondok Pesantren Al-Ghazali Karangmulya'
];

const INCOME_BRACKETS = [
  'Di bawah Rp 1.500.000',
  'Rp 1.500.000 - Rp 3.000.000',
  'Rp 3.000.000 - Rp 5.000.000',
  'Rp 5.000.000 - Rp 10.000.000',
  'Di atas Rp 10.000.000'
];

const JAMIYAHS = [
  'Majelis Taklim Al-Hikmah',
  'Jamiyyah Yasin Riyadlus Sholihin',
  'Majelis Dzikir Al-Muawanah',
  'Majelis Sholawat Nariyah',
  'Lailatul Ijtima Ranting'
];

// Helper to get random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to generate 16 digit number
function randomDigits(len: number): string {
  let res = '';
  for (let i = 0; i < len; i++) {
    res += Math.floor(Math.random() * 10).toString();
  }
  return res;
}

// Generate single structured Member (Anggota) plus their 1:1 and M:N relations
export function generateMockMember(
  id: number,
  rantingId: number,
  createdByUid: string,
  forceGender?: 'L' | 'P'
): {
  anggota: Anggota;
  pendidikan: AnggotaPendidikan;
  pekerjaan: AnggotaPekerjaan;
  potensiIds: number[];
} {
  const gender = forceGender || (Math.random() > 0.45 ? 'L' : 'P');
  const firstName = gender === 'L' ? randomItem(FIRST_NAMES_L) : randomItem(FIRST_NAMES_P);
  const lastName = gender === 'L' ? randomItem(LAST_NAMES_L) : randomItem(LAST_NAMES_P);
  const name = `${firstName} ${lastName}`;

  const birthYear = 1960 + Math.floor(Math.random() * 45); // ages 21 to 66
  const birthMonth = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const birthDay = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  const dob = `${birthYear}-${birthMonth}-${birthDay}`;

  const nik = `320512${birthDay}${birthMonth}${String(birthYear).substring(2)}${randomDigits(4)}`;
  const noKK = `320512${randomDigits(10)}`;

  const randomRantCode = String(rantingId).padStart(2, '0');
  const randomMembCode = String(id).padStart(4, '0');
  const isApproved = Math.random() > 0.15;
  const statusSensus: Anggota['status_sensus'] = isApproved
    ? 'Disetujui'
    : randomItem(['Draft', 'Menunggu Verifikasi', 'Revisi', 'Ditolak']);

  const ktaNumber = isApproved ? `KTA-320512-${randomRantCode}${randomMembCode}` : null;
  const rt = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const rw = String(1 + Math.floor(Math.random() * 6)).padStart(2, '0');

  const now = new Date().toISOString();

  // Create core Anggota row
  const anggota: Anggota = {
    id,
    nik,
    no_kk: noKK,
    name,
    gender,
    place_of_birth: 'Garut',
    date_of_birth: dob,
    marital_status: randomItem(['Kawin', 'Belum Kawin', 'Cerai Hidup', 'Cerai Mati']),
    is_alive: Math.random() > 0.02, // 2% chance deceased (Soft Delete test)
    address: `Kp. Babakan RT ${rt} RW ${rw}`,
    rt,
    rw,
    phone: `0812${randomDigits(8)}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
    photo_url: null,
    ranting_id: rantingId,
    banom_id: gender === 'P' ? randomItem([2, 3, 5]) : randomItem([1, 4, 6]), // Muslimat/Fatayat vs Ansor/IPNU
    jamiyah: randomItem(JAMIYAHS),
    status_active: Math.random() > 0.1,
    year_joined: birthYear + 18 + Math.floor(Math.random() * 20),
    kta_number: ktaNumber,
    status_sensus: statusSensus,
    notes: statusSensus === 'Revisi' ? 'Foto KTP buram, harap upload ulang' : statusSensus === 'Ditolak' ? 'NIK tidak valid atau KK ganda' : 'Berkas divalidasi',
    created_by_uid: createdByUid,
    created_at: now,
    updated_at: now
  };

  // Create 1:1 Education detail
  const lastEdu = randomItem(['SD', 'SMP', 'SMA', 'D3', 'S1', 'S2', 'Pesantren']);
  const schoolChoice = randomItem(SCHOOLS);
  const isPesantrenGrad = Math.random() > 0.4;
  
  const pendidikan: AnggotaPendidikan = {
    id,
    anggota_id: id,
    last_education: lastEdu as any,
    school_name: lastEdu !== 'Pesantren' && lastEdu !== 'SD' ? schoolChoice.name : null,
    major: lastEdu !== 'Pesantren' && lastEdu !== 'SD' && lastEdu !== 'SMP' ? schoolChoice.major : null,
    pesantren_name: isPesantrenGrad ? randomItem(PESANTRENS) : null,
    pesantren_duration_years: isPesantrenGrad ? 1 + Math.floor(Math.random() * 9) : null,
    skills: randomItem(['Kajian Fiqih', 'Manajemen Masjid', 'Pendidik TPQ', 'Bercocok Tanam', 'Digital Marketing', 'Teknisi']),
    certifications: isPesantrenGrad ? 'Syahadah Sanad Kitab' : null,
    created_at: now,
    updated_at: now
  };

  // Create 1:1 Employment detail
  const profChoice = randomItem(PROFESSIONS);
  const hasUMKM = Math.random() > 0.7;

  const pekerjaan: AnggotaPekerjaan = {
    id,
    anggota_id: id,
    profession: profChoice.name,
    company_name: profChoice.company,
    position: profChoice.position,
    has_umkm: hasUMKM,
    umkm_name: hasUMKM ? `UMKM Berkah ${firstName}` : null,
    umkm_sector: hasUMKM ? randomItem(['Kuliner', 'Pertanian', 'Perdagangan', 'Kerajinan']) : null,
    monthly_income: randomItem(INCOME_BRACKETS),
    created_at: now,
    updated_at: now
  };

  // Mapping potentials based on background
  const potensiIds: number[] = [];
  
  // Logical auto-assignment
  if (isPesantrenGrad) {
    potensiIds.push(randomItem([1, 2, 3, 4])); // Kyai, Ustadz, Hafidz, Qori
  }
  if (profChoice.name === 'Guru / Pendidik' || lastEdu === 'S1') {
    potensiIds.push(randomItem([6, 7, 8])); // Guru TPQ, Guru, Dosen
  }
  if (profChoice.name === 'Petani / Pekebun' || profChoice.name === 'Peternak') {
    potensiIds.push(randomItem([16, 17])); // Petani, Peternak
  }
  if (profChoice.name === 'Wiraswasta' || hasUMKM) {
    potensiIds.push(15); // Pengusaha
  }
  if (gender === 'L' && Math.random() > 0.6) {
    potensiIds.push(18); // Relawan / Banser
  }
  
  // If nothing assigned, give a general one
  if (potensiIds.length === 0) {
    potensiIds.push(randomItem([5, 14])); // Takmir, MC
  }

  return {
    anggota,
    pendidikan,
    pekerjaan,
    potensiIds: Array.from(new Set(potensiIds)) // deduplicate
  };
}
