import React from 'react';
import { ProcessedItem } from '../types';
import { X, ArrowLeft, ArrowRight, Wand2, RefreshCw, Pencil, FileText, Table, File } from 'lucide-react';

interface ImageCardProps {
  image: ProcessedItem;
  index: number;
  total: number;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onAnalyze: (id: string) => void;
  onEdit: (image: ProcessedItem) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ 
  image: item, // Renaming prop locally to item as it can be a file
  index, 
  total, 
  onRemove, 
  onMove, 
  onAnalyze,
  onEdit
}) => {
  const isImage = item.type === 'image';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col group hover:shadow-md transition-all duration-200">
      {/* Preview Area */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden group/image">
        {isImage ? (
          <img 
            src={item.previewUrl} 
            alt="Preview" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105" 
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
             {item.type === 'docx' ? (
                <FileText size={48} className="text-blue-500" />
             ) : item.type === 'xlsx' ? (
                <Table size={48} className="text-green-500" />
             ) : (
                <File size={48} />
             )}
             <span className="text-xs font-medium px-4 text-center truncate w-full max-w-[200px] text-gray-500 dark:text-gray-400">
               {item.file.name}
             </span>
          </div>
        )}
        
        {/* Overlay Controls */}
        <div className="absolute top-2 right-2 flex gap-1">
           {isImage && (
             <button 
              onClick={() => onEdit(item)}
              className="p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors shadow-sm"
              title="Editar imagen"
            >
              <Pencil size={16} />
            </button>
           )}
          <button 
            onClick={() => onRemove(item.id)}
            className="p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors shadow-sm"
            title="Eliminar archivo"
          >
            <X size={16} />
          </button>
        </div>

        {/* Page Number Badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md">
          <span className="text-xs font-medium text-white">Pág {index + 1}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          {/* Specific content for Docs/Excel */}
          {!isImage && (
            <div className="mb-3">
               <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-4 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-700 italic">
                 {item.type === 'docx' && item.textContent ? item.textContent.slice(0, 150) + "..." : 
                  item.type === 'xlsx' ? `Libro de Excel: ${(item.tableData?.length || 0)} hojas encontradas.` : 
                  "Contenido listo para PDF"}
               </p>
            </div>
          )}

          {isImage && (
             item.isAnalyzing ? (
               <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm py-2 animate-pulse">
                 <Wand2 size={16} className="animate-spin" />
                 <span>Analizando con Gemini...</span>
               </div>
            ) : item.description ? (
              <div className="mb-3 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                 <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed line-clamp-3" title={item.description}>
                   ✨ {item.description}
                 </p>
              </div>
            ) : (
               <div className="mb-3">
                  <button 
                    onClick={() => onAnalyze(item.id)}
                    className="w-full py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    <Wand2 size={14} className="group-hover/btn:text-indigo-500 dark:group-hover/btn:text-indigo-400" />
                    Generar descripción con IA
                  </button>
               </div>
            )
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mt-2">
           <div className="flex gap-1">
             <button 
               onClick={() => onMove(index, -1)}
               disabled={index === 0}
               className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               title="Mover atrás"
             >
               <ArrowLeft size={16} />
             </button>
             <button 
               onClick={() => onMove(index, 1)}
               disabled={index === total - 1}
               className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               title="Mover adelante"
             >
               <ArrowRight size={16} />
             </button>
           </div>
           
           {isImage && item.description && (
             <button 
               onClick={() => onAnalyze(item.id)}
               className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-400 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
               title="Regenerar descripción"
             >
               <RefreshCw size={14} />
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default ImageCard;