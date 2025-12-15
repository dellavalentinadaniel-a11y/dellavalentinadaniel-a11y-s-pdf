import React, { useEffect, useState } from 'react';
import { X, Loader2, Download } from 'lucide-react';
import { ProcessedItem, PdfSettings } from '../types';
import { generatePdfBlobUrl, generatePdfDocument } from '../utils/pdfUtils';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ProcessedItem[];
  settings: PdfSettings;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ isOpen, onClose, images, settings }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && images.length > 0) {
      setLoading(true);
      // Small delay to allow UI to render the modal first and prevent blocking
      const timer = setTimeout(async () => {
        try {
            const url = await generatePdfBlobUrl(images, settings);
            setBlobUrl(url);
        } catch (e) {
            console.error("Error generating preview:", e);
        } finally {
            setLoading(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
        setBlobUrl(null);
    }
  }, [isOpen, images, settings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Vista Previa del PDF</h3>
          <div className="flex items-center gap-2">
             <button 
               onClick={() => generatePdfDocument(images, settings)}
               className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
             >
                <Download size={16} />
                <span className="hidden sm:inline">Descargar PDF</span>
             </button>
             <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
               <X size={20} />
             </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-grow bg-gray-200 dark:bg-gray-900 p-4 flex items-center justify-center overflow-hidden relative">
           {loading ? (
             <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
               <Loader2 size={40} className="animate-spin text-blue-500" />
               <p className="font-medium">Generando vista previa...</p>
             </div>
           ) : blobUrl ? (
             <iframe 
               src={blobUrl} 
               className="w-full h-full rounded-lg shadow-lg bg-white" 
               title="PDF Preview"
             />
           ) : (
             <p className="text-gray-500 dark:text-gray-400">No hay contenido para mostrar.</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;