export type FileType = 'image' | 'docx' | 'xlsx';

export interface ProcessedItem {
  id: string;
  file: File;
  type: FileType;
  previewUrl?: string; // For images
  textContent?: string; // For DOCX
  tableData?: { name: string; data: string[][] }[]; // For XLSX (Array of sheets)
  width?: number; // For images
  height?: number; // For images
  description?: string; // AI generated description (mostly for images)
  isAnalyzing?: boolean;
}

export interface PdfSettings {
  pageSize: 'a4' | 'letter';
  orientation: 'p' | 'l'; // portrait | landscape
  includeDescriptions: boolean;
  quality: number; // 0 to 1
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}