import React from 'react';
import { UploadCloud, FileType } from 'lucide-react';

interface EmptyStateProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onUpload }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center transition-all hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 group">
      <div className="relative mb-6">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
        <div className="relative bg-white dark:bg-gray-700 p-4 rounded-full shadow-sm">
          <UploadCloud className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Sube tus archivos aquí</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        Soporta Imágenes (JPG, PNG), Word (.docx) y Excel (.xlsx).
        <br/><span className="text-xs text-gray-400 dark:text-gray-500">Nota: Para Google Docs/Sheets, descárgalos primero como Word/Excel.</span>
      </p>

      <label className="cursor-pointer">
        <span className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-lg shadow-lg shadow-blue-600/30 dark:shadow-blue-900/30 transition-all active:scale-95 flex items-center gap-2">
          <FileType className="w-5 h-5" />
          Seleccionar Archivos
        </span>
        <input 
          type="file" 
          multiple 
          accept="image/*,.docx,.xlsx" 
          className="hidden" 
          onChange={onUpload}
        />
      </label>
    </div>
  );
};

export default EmptyState;