/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseState } from '../schema';

export default {
  id: '0006_add_photos_and_potentials_to_ranting',
  up: (db: DatabaseState): void => {
    if (!db.rantings) {
      db.rantings = [];
    }

    // High quality warm Indonesian cleric/leader styled profiles
    const samplePhotos = {
      rois: [
        'https://upload.wikimedia.org/wikipedia/commons/c/cb/KH_Yahya_Cholil_Staquf.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/e/e5/Gus_Baha.png',
        'https://upload.wikimedia.org/wikipedia/commons/e/e0/Said_Aqil_Siradj.jpg'
      ],
      leader: [
        'https://upload.wikimedia.org/wikipedia/commons/e/e0/Said_Aqil_Siradj.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/c/cb/KH_Yahya_Cholil_Staquf.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/e/e5/Gus_Baha.png'
      ],
      secretary: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=150&h=150&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&h=150&fit=crop&crop=face'
      ]
    };

    // Mapping realistic economic potentials relevant to Garut / Karangpawitan villages
    const potentialsMap: { [key: number]: { ekonomi: string[]; unggulan: string } } = {
      1: { ekonomi: ['Pertanian', 'UMKM', 'Peternakan'], unggulan: 'Sentra Hortikultura (Cabai & Tomat)' },
      2: { ekonomi: ['Pertanian', 'UMKM', 'Perdagangan'], unggulan: 'Budidaya Padi Organik' },
      3: { ekonomi: ['Peternakan', 'Pertanian', 'UMKM'], unggulan: 'Peternakan Domba Garut Unggulan' },
      4: { ekonomi: ['UMKM', 'Perdagangan', 'Industri Rumah Tangga'], unggulan: 'Sentra Kerajinan Kulit Karangpawitan' },
      5: { ekonomi: ['Pertanian', 'Perkebunan', 'UMKM'], unggulan: 'Perkebunan Kopi Arabika' },
      6: { ekonomi: ['Perdagangan', 'UMKM', 'Jasa'], unggulan: 'Sentra Kuliner Dodol & Ladu Tradisional' },
      7: { ekonomi: ['Pertanian', 'Peternakan'], unggulan: 'Sentra Pembibitan Sapi Potong' },
      8: { ekonomi: ['Industri Rumah Tangga', 'UMKM', 'Perdagangan'], unggulan: 'Kerajinan Anyaman Bambu' },
      9: { ekonomi: ['UMKM', 'Perdagangan', 'Pertanian'], unggulan: 'Sentra Kerajinan Bata Merah' },
      10: { ekonomi: ['Pertanian', 'Perikanan Darat'], unggulan: 'Budidaya Ikan Nila & Mas Kolam Air Deras' },
      11: { ekonomi: ['Pertanian', 'Peternakan', 'Perkebunan'], unggulan: 'Budidaya Domba & Pakan Mandiri' },
      12: { ekonomi: ['UMKM', 'Jasa', 'Perdagangan'], unggulan: 'Klaster UMKM Konveksi & Jahit Hijab' },
      13: { ekonomi: ['Pertanian', 'UMKM', 'Kerajinan'], unggulan: 'Pembuatan Mebel & Ukir Kayu' },
      14: { ekonomi: ['Perkebunan', 'Pertanian'], unggulan: 'Budidaya Jagung & Olahan Pakan' },
      15: { ekonomi: ['UMKM', 'Perdagangan', 'Industri Rumah Tangga'], unggulan: 'Sentra Produksi Tempe & Tahu Higienis' },
      16: { ekonomi: ['Pertanian', 'Peternakan', 'Perikanan'], unggulan: 'Integrasi Mina-Padi Terpadu' },
      17: { ekonomi: ['Peternakan', 'Perdagangan'], unggulan: 'Budidaya Kelinci Hias & Pedaging' },
      18: { ekonomi: ['Pertanian', 'Perkebunan'], unggulan: 'Budidaya Jahe Merah & Tanaman Herbal' },
      19: { ekonomi: ['UMKM', 'Jasa', 'Perdagangan'], unggulan: 'Sentra Bakso Aci (Baci) & Kuliner Pedas' },
      20: { ekonomi: ['Kerajinan', 'UMKM', 'Perdagangan'], unggulan: 'Sentra Anyaman Pandan & Tas Tradisional' }
    };

    db.rantings = db.rantings.map(ranting => {
      // Pick photos deterministically based on ranting ID to ensure stability
      const roisPhoto = samplePhotos.rois[ranting.id % samplePhotos.rois.length];
      const leaderPhoto = samplePhotos.leader[ranting.id % samplePhotos.leader.length];
      const secPhoto = samplePhotos.secretary[ranting.id % samplePhotos.secretary.length];

      const pots = potentialsMap[ranting.id] || { 
        ekonomi: ['Pertanian', 'UMKM'], 
        unggulan: 'Pertanian Terpadu Wilayah' 
      };

      return {
        ...ranting,
        rois_photo_url: ranting.rois_photo_url || roisPhoto,
        leader_photo_url: ranting.leader_photo_url || leaderPhoto,
        secretary_photo_url: ranting.secretary_photo_url || secPhoto,
        potensi_ekonomi: ranting.potensi_ekonomi && ranting.potensi_ekonomi.length > 0 ? ranting.potensi_ekonomi : pots.ekonomi,
        potensi_unggulan: ranting.potensi_unggulan || pots.unggulan
      };
    });
  }
};
