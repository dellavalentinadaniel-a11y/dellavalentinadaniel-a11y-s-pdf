import React from 'react';
import { X, Save, FileText, Smartphone, Monitor, ImageDown, Gauge } from 'lucide-react';
import { PdfSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PdfSettings;
  onUpdate: (newSettings: PdfSettings) => void;
  onSaveDefault: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdate, 
  onSaveDefault 
}) => {
  if (!isOpen) return null;

  const qualityOptions = [
    { label: 'Baja', value: 0.4, desc: 'Archivos pequeños' },
    { label: 'Media', value: 0.6, desc: 'Balanceado' },
    { label: 'Alta', value: 0.8, desc: 'Buena calidad' },
    { label: 'Máx', value: 1.0, desc: 'Original' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Configuración de PDF</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Page Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tamaño de Página</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdate({ ...settings, pageSize: 'a4' })}
                className={`px-4 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                  settings.pageSize === 'a4' 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <FileText size={18} /> A4
              </button>
              <button
                onClick={() => onUpdate({ ...settings, pageSize: 'letter' })}
                className={`px-4 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                  settings.pageSize === 'letter' 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <FileText size={18} /> Carta
              </button>
            </div>
          </div>

          {/* Orientation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Orientación</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdate({ ...settings, orientation: 'p' })}
                className={`px-4 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                  settings.orientation === 'p' 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Smartphone size={18} /> Vertical
              </button>
              <button
                onClick={() => onUpdate({ ...settings, orientation: 'l' })}
                className={`px-4 py-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                  settings.orientation === 'l' 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Monitor size={18} /> Horizontal
              </button>
            </div>
          </div>

           {/* Image Quality */}
           <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Gauge size={16} /> Calidad de Imagen
            </label>
            <div className="grid grid-cols-4 gap-2">
              {qualityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ ...settings, quality: opt.value })}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                    settings.quality === opt.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                  title={opt.desc}
                >
                  <span className="text-sm font-bold">{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              {qualityOptions.find(opt => opt.value === settings.quality)?.desc}
            </p>
          </div>

          {/* Include Descriptions */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Incluir descripciones IA</span>
             <label className="relative inline-flex items-center cursor-pointer">
               <input 
                 type="checkbox" 
                 className="sr-only peer"
                 checked={settings.includeDescriptions}
                 onChange={(e) => onUpdate({ ...settings, includeDescriptions: e.target.checked })}
               />
               <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
             </label>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
          <button 
             onClick={onSaveDefault}
             className="flex-1 bg-gray-800 dark:bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Save size={16} />
            Guardar predeterminado
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;