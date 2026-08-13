/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DocumentVersion {
  version: string;
  updated_at: string;
  updated_by: string;
  notes: string;
  file_size: string;
  file_url?: string;
}

export interface Document {
  id: number;
  title: string;
  number: string; // e.g., Nomor SK, Nomor Surat
  category: 'SK Kepengurusan' | 'AD/ART' | 'Proposal & LPJ' | 'Surat Resmi' | 'Pedoman & Panduan' | 'Dokumen Lainnya';
  status: 'Aktif' | 'Arsip' | 'Draf' | 'Ditinjau';
  description: string;
  file_name: string;
  file_size: string;
  file_url?: string; // Tautan file / Google Drive / Lokasi Fisik Arsip
  input_method?: 'file' | 'manual';
  uploaded_at: string;
  uploaded_by: string;
  download_count: number;
  tags: string[];
  versions: DocumentVersion[];
}

const STORAGE_KEY = 'mwc_document_items';

export const DEFAULT_DOCUMENTS: Document[] = [
  {
    id: 1,
    title: 'SK Kepengurusan MWC NU Karangpawitan Khidmat 2024-2029',
    number: '042/A.II/04/MWC-KP/2024',
    category: 'SK Kepengurusan',
    status: 'Aktif',
    description: 'Surat Keputusan resmi dari Pengurus Cabang Nahdlatul Ulama (PCNU) Kabupaten Garut mengenai susunan pengurus Majelis Wakil Cabang Nahdlatul Ulama Kecamatan Karangpawitan.',
    file_name: 'SK_MWC_NU_Karangpawitan_2024_2029.pdf',
    file_size: '2.4 MB',
    uploaded_at: '2024-05-12',
    uploaded_by: 'Ustadz Hasan',
    download_count: 42,
    tags: ['SK', 'Kepengurusan', 'PCNU', 'Legalitas'],
    versions: [
      {
        version: '1.1',
        updated_at: '2025-02-18',
        updated_by: 'Kiai Ahmad',
        notes: 'Penyesuaian nama pengurus ranting yang di-reshuffle.',
        file_size: '2.4 MB'
      },
      {
        version: '1.0',
        updated_at: '2024-05-12',
        updated_by: 'Ustadz Hasan',
        notes: 'Rilis draf pertama SK disetujui PCNU.',
        file_size: '2.3 MB'
      }
    ]
  },
  {
    id: 2,
    title: 'Anggaran Dasar & Anggaran Rumah Tangga (AD/ART) NU Hasil Muktamar 34',
    number: 'Muktamar-34/2021',
    category: 'AD/ART',
    status: 'Aktif',
    description: 'Dokumen AD/ART Nahdlatul Ulama resmi hasil keputusan Muktamar Ke-34 Lampung tahun 2021 untuk dijadikan pedoman dasar organisasi tingkat MWC dan Ranting.',
    file_name: 'AD_ART_NU_Muktamar_34.pdf',
    file_size: '4.1 MB',
    uploaded_at: '2024-01-10',
    uploaded_by: 'Ustadz Hasan',
    download_count: 115,
    tags: ['AD/ART', 'Pedoman', 'Muktamar', 'Aturan'],
    versions: [
      {
        version: '1.0',
        updated_at: '2024-01-10',
        updated_by: 'Ustadz Hasan',
        notes: 'Versi rilis standar muktamar Lampung.',
        file_size: '4.1 MB'
      }
    ]
  },
  {
    id: 3,
    title: 'Proposal Pembangunan Gedung Dakwah MWC NU Karangpawitan',
    number: '018/PRP/MWC-KP/V/2026',
    category: 'Proposal & LPJ',
    status: 'Ditinjau',
    description: 'Proposal penggalangan dana umat dan bantuan pemerintah untuk pembangunan tahap II Gedung Dakwah MWC NU Karangpawitan Garut.',
    file_name: 'Proposal_Pembangunan_Gedung_Dakwah_Tahap2.docx',
    file_size: '1.8 MB',
    uploaded_at: '2026-05-20',
    uploaded_by: 'Kiai Ahmad',
    download_count: 18,
    tags: ['Proposal', 'Pembangunan', 'Donasi', 'Gedung Dakwah'],
    versions: [
      {
        version: '2.0',
        updated_at: '2026-06-15',
        updated_by: 'Kiai Ahmad',
        notes: 'Revisi RAB disesuaikan dengan harga bahan bangunan terbaru Juni 2026.',
        file_size: '1.8 MB'
      },
      {
        version: '1.0',
        updated_at: '2026-05-20',
        updated_by: 'Ustadz Hasan',
        notes: 'Draft awal proposal pembangunan.',
        file_size: '1.7 MB'
      }
    ]
  }
];

export const documentService = {
  /**
   * Fetch all documents from local storage. Fallback to defaults.
   */
  getDocuments(): Document[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved documents, using defaults', e);
        return DEFAULT_DOCUMENTS;
      }
    }
    this.saveDocumentsToStorage(DEFAULT_DOCUMENTS);
    return DEFAULT_DOCUMENTS;
  },

  /**
   * Save documents list to local storage and dispatch update.
   */
  saveDocumentsToStorage(docs: Document[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    window.dispatchEvent(new Event('storage'));
  },

  /**
   * Validate document data.
   */
  validate(data: Partial<Omit<Document, 'id' | 'uploaded_at' | 'uploaded_by' | 'download_count' | 'versions'>>): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!data.title || !data.title.trim()) {
      errors.title = 'Judul dokumen wajib diisi.';
    } else if (data.title.trim().length < 5) {
      errors.title = 'Judul dokumen terlalu pendek (minimal 5 karakter).';
    }

    if (!data.number || !data.number.trim()) {
      errors.number = 'Nomor dokumen / surat / SK wajib diisi.';
    }

    const validCategories = [
      'SK Kepengurusan', 
      'AD/ART', 
      'Proposal & LPJ', 
      'Surat Resmi', 
      'Pedoman & Panduan', 
      'Dokumen Lainnya'
    ];
    if (!data.category || !validCategories.includes(data.category)) {
      errors.category = 'Kategori dokumen tidak valid atau wajib dipilih.';
    }

    const validStatuses = ['Aktif', 'Arsip', 'Draf', 'Ditinjau'];
    if (!data.status || !validStatuses.includes(data.status)) {
      errors.status = 'Status dokumen tidak valid.';
    }

    if (!data.file_name || !data.file_name.trim()) {
      errors.file_name = 'Nama file wajib ditentukan.';
    }

    return errors;
  },

  /**
   * Add a new document with an initial version.
   */
  createDocument(
    data: Omit<Document, 'id' | 'uploaded_at' | 'uploaded_by' | 'download_count' | 'versions'>,
    username: string,
    initialVersionNotes: string
  ): { success: boolean; data?: Document; errors?: Record<string, string> } {
    const errors = this.validate(data);
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const docs = this.getDocuments();
    
    // Auto-generate size if not specified
    const fileSize = data.file_size || `${(Math.random() * 3 + 1).toFixed(1)} MB`;

    const newDoc: Document = {
      ...data,
      id: docs.length > 0 ? Math.max(...docs.map(d => d.id)) + 1 : 1,
      file_size: fileSize,
      uploaded_at: new Date().toISOString().split('T')[0],
      uploaded_by: username,
      download_count: 0,
      versions: [
        {
          version: '1.0',
          updated_at: new Date().toISOString().split('T')[0],
          updated_by: username,
          notes: initialVersionNotes || 'Inisiasi dokumen pertama kali.',
          file_size: fileSize
        }
      ]
    };

    const updated = [newDoc, ...docs];
    this.saveDocumentsToStorage(updated);

    return { success: true, data: newDoc };
  },

  /**
   * Update metadata or upload a new version.
   */
  updateDocument(
    id: number,
    data: Omit<Document, 'id' | 'uploaded_at' | 'uploaded_by' | 'download_count' | 'versions'>,
    isNewVersion: boolean,
    newVersionNumber: string,
    versionNotes: string,
    username: string
  ): { success: boolean; data?: Document; errors?: Record<string, string> } {
    const errors = this.validate(data);
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const docs = this.getDocuments();
    const docIndex = docs.findIndex(d => d.id === id);
    if (docIndex === -1) {
      return { success: false, errors: { general: 'Dokumen tidak ditemukan.' } };
    }

    const currentDoc = docs[docIndex];
    let updatedVersions = [...currentDoc.versions];
    let updatedFileName = currentDoc.file_name;
    let updatedFileSize = currentDoc.file_size;

    if (isNewVersion) {
      // Validate version string format (e.g., "1.2", "2.0")
      if (!newVersionNumber || !newVersionNumber.trim()) {
        return { success: false, errors: { version_number: 'Nomor versi baru wajib diisi jika mengunggah revisi baru.' } };
      }

      updatedFileName = data.file_name;
      updatedFileSize = data.file_size || `${(Math.random() * 3 + 1).toFixed(1)} MB`;

      updatedVersions.unshift({
        version: newVersionNumber,
        updated_at: new Date().toISOString().split('T')[0],
        updated_by: username,
        notes: versionNotes || 'Unggahan versi revisi.',
        file_size: updatedFileSize
      });
    }

    const updatedDoc: Document = {
      ...currentDoc,
      ...data,
      file_name: updatedFileName,
      file_size: updatedFileSize,
      versions: updatedVersions
    };

    const updatedList = [...docs];
    updatedList[docIndex] = updatedDoc;
    this.saveDocumentsToStorage(updatedList);

    return { success: true, data: updatedDoc };
  },

  /**
   * Increment download count.
   */
  incrementDownload(id: number): void {
    const docs = this.getDocuments();
    const docIndex = docs.findIndex(d => d.id === id);
    if (docIndex !== -1) {
      docs[docIndex].download_count += 1;
      this.saveDocumentsToStorage(docs);
    }
  },

  /**
   * Delete a document.
   */
  deleteDocument(id: number): { success: boolean; error?: string } {
    const docs = this.getDocuments();
    const filtered = docs.filter(d => d.id !== id);
    if (filtered.length === docs.length) {
      return { success: false, error: 'Dokumen tidak ditemukan.' };
    }
    this.saveDocumentsToStorage(filtered);
    return { success: true };
  }
};
