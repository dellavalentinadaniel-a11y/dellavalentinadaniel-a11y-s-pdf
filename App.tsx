import React, { useState, useEffect } from 'react';
import { ProcessedItem, PdfSettings, AppState } from './types';
import { generatePdfDocument, fileToBase64, getImageDimensions } from './utils/pdfUtils';
import { processDocxFile, processXlsxFile } from './utils/docProcessors';
import { analyzeImageContent } from './services/geminiService';
import Header from './components/Header';
import EmptyState from './components/EmptyState';
import ImageCard from './components/ImageCard';
import SettingsModal from './components/SettingsModal';
import PdfPreviewModal from './components/PdfPreviewModal';
import ImageEditorModal from './components/ImageEditorModal';
import { Plus, Download, FileCheck, AlertCircle, Settings2, CheckCircle2, Eye, LayoutGrid, List } from 'lucide-react';

const App = () => {
  const [images, setImages] = useState<ProcessedItem[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('picToPdfTheme');
        // Default to dark mode if not set, looks cooler
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Apply Theme
  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('picToPdfTheme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('picToPdfTheme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Initialize settings from localStorage or defaults
  const [settings, setSettings] = useState<PdfSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('picToPdfSettings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
    }
    return {
      pageSize: 'a4',
      orientation: 'p',
      includeDescriptions: true,
      quality: 0.8
    };
  });

  // Layout preference state
  const [layout, setLayout] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('picToPdfLayout') as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<ProcessedItem | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setAppState(AppState.IDLE);
    setErrorMessage(null);

    const newFiles = Array.from(e.target.files) as File[];
    
    // Process files based on type
    const processedPromises = newFiles.map(async (file) => {
      const id = crypto.randomUUID();
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'docx') {
        // Handle Word
        try {
          const textContent = await processDocxFile(file);
          return {
            id,
            file,
            type: 'docx',
            textContent
          } as ProcessedItem;
        } catch (e) {
          console.error("Error reading docx", e);
          return null;
        }
      } else if (ext === 'xlsx') {
        // Handle Excel
        try {
          const tableData = await processXlsxFile(file);
          return {
            id,
            file,
            type: 'xlsx',
            tableData
          } as ProcessedItem;
        } catch (e) {
           console.error("Error reading xlsx", e);
           return null;
        }
      } else {
        // Handle Image (Default)
        try {
          const base64 = await fileToBase64(file);
          const dimensions = await getImageDimensions(base64);
          return {
            id,
            file,
            type: 'image',
            previewUrl: base64,
            width: dimensions.width,
            height: dimensions.height,
          } as ProcessedItem;
        } catch (e) {
          console.error("Error reading image", e);
          return null;
        }
      }
    });

    try {
      const results = await Promise.all(processedPromises);
      const successfulItems = results.filter(item => item !== null) as ProcessedItem[];
      
      if (successfulItems.length < newFiles.length) {
        setErrorMessage("Algunos archivos no se pudieron procesar (Formatos soportados: Imágenes, .docx, .xlsx).");
      }
      
      setImages(prev => [...prev, ...successfulItems]);
    } catch (error) {
      console.error("Error processing files", error);
      setErrorMessage("Error al procesar los archivos. Intenta nuevamente.");
    }
    
    // Reset input
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const newImages = [...images];
    const targetIndex = index + direction;
    
    if (targetIndex >= 0 && targetIndex < newImages.length) {
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      setImages(newImages);
    }
  };

  const handleSaveEditedImage = (id: string, newUrl: string, width: number, height: number) => {
    setImages(prev => prev.map(img => 
      img.id === id 
        ? { ...img, previewUrl: newUrl, width, height }
        : img
    ));
  };

  const analyzeImage = async (id: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, isAnalyzing: true } : img
    ));

    try {
      const image = images.find(img => img.id === id);
      if (!image || image.type !== 'image' || !image.previewUrl) return;

      // Extract raw base64 (remove data:image/png;base64, prefix)
      const base64Data = image.previewUrl.split(',')[1];
      const mimeType = image.previewUrl.split(';')[0].split(':')[1];

      const description = await analyzeImageContent(base64Data, mimeType);

      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, description, isAnalyzing: false } : img
      ));
    } catch (error) {
      console.error(error);
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, isAnalyzing: false } : img
      ));
      alert("Error al analizar la imagen con Gemini. Verifica tu API Key.");
    }
  };

  const analyzeAllImages = async () => {
    // Only analyze images
    const imagesToAnalyze = images.filter(img => img.type === 'image' && !img.description);
    for (const img of imagesToAnalyze) {
      await analyzeImage(img.id);
    }
  };

  const handleGeneratePdf = async () => {
    setAppState(AppState.GENERATING);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      await generatePdfDocument(images, settings);
      setAppState(AppState.SUCCESS);
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    } catch (error) {
      console.error(error);
      setErrorMessage("Ocurrió un error al generar el PDF.");
      setAppState(AppState.ERROR);
    }
  };

  const handleSaveDefaults = () => {
    localStorage.setItem('picToPdfSettings', JSON.stringify(settings));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    setIsSettingsOpen(false);
  };

  const toggleLayout = (newLayout: 'grid' | 'list') => {
    setLayout(newLayout);
    localStorage.setItem('picToPdfLayout', newLayout);
  };

  const hasImages = images.some(i => i.type === 'image');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Toolbar / Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center gap-4">
             <label className="flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors font-medium text-sm">
                <Plus size={18} />
                <span>Agregar Archivos</span>
                <input type="file" multiple accept="image/*,.docx,.xlsx" className="hidden" onChange={handleFileUpload} />
             </label>
             
             {hasImages && (
               <button 
                 onClick={analyzeAllImages}
                 className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
               >
                 <Settings2 size={18} />
                 <span className="hidden sm:inline">Analizar Imágenes (IA)</span>
               </button>
             )}
          </div>

          {images.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 justify-end">
               {/* Layout Controls */}
               <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
                  <button 
                    onClick={() => toggleLayout('grid')}
                    className={`p-1.5 rounded-md transition-all ${layout === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    title="Vista Cuadrícula"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => toggleLayout('list')}
                    className={`p-1.5 rounded-md transition-all ${layout === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    title="Vista Lista"
                  >
                    <List size={18} />
                  </button>
               </div>

               <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

               {/* Preview Button */}
               <button 
                 onClick={() => setIsPreviewOpen(true)}
                 className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                 title="Vista Previa"
               >
                 <Eye size={20} />
                 <span className="text-sm font-medium hidden sm:inline">Vista Previa</span>
               </button>

               {/* Settings Button */}
               <button 
                 onClick={() => setIsSettingsOpen(true)}
                 className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                 title="Configuración PDF"
               >
                 <Settings2 size={20} />
                 <span className="text-sm font-medium hidden sm:inline">Configuración</span>
               </button>

               <button
                 onClick={handleGeneratePdf}
                 disabled={appState === AppState.GENERATING}
                 className={`
                   flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/10 transition-all
                   ${appState === AppState.GENERATING 
                     ? 'bg-blue-400 dark:bg-blue-600 cursor-wait' 
                     : 'bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0'}
                 `}
               >
                 {appState === AppState.GENERATING ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     Generando...
                   </>
                 ) : (
                   <>
                     <Download size={20} />
                     Descargar PDF
                   </>
                 )}
               </button>
            </div>
          )}
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            {errorMessage}
          </div>
        )}

        {appState === AppState.SUCCESS && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-3 animate-fade-in">
            <FileCheck size={20} />
            ¡PDF generado exitosamente! La descarga ha comenzado.
          </div>
        )}

        {saveSuccess && (
          <div className="fixed bottom-4 right-4 bg-gray-800 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in z-50">
            <CheckCircle2 size={18} className="text-green-400 dark:text-green-600" />
            Configuración predeterminada guardada
          </div>
        )}

        {/* Image Grid or Empty State */}
        {images.length === 0 ? (
          <EmptyState onUpload={handleFileUpload} />
        ) : (
          <div className={
            layout === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "flex flex-col gap-4 max-w-3xl mx-auto"
          }>
            {images.map((image, index) => (
              <ImageCard 
                key={image.id}
                image={image}
                index={index}
                total={images.length}
                onRemove={removeImage}
                onMove={moveImage}
                onAnalyze={analyzeImage}
                onEdit={setEditingImage}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} PicToPDF AI. Convierte tus imágenes de forma segura en tu navegador.</p>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdate={setSettings}
        onSaveDefault={handleSaveDefaults}
      />

      {/* Preview Modal */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        images={images}
        settings={settings}
      />

      {/* Editor Modal */}
      <ImageEditorModal
        isOpen={!!editingImage}
        onClose={() => setEditingImage(null)}
        image={editingImage}
        onSave={handleSaveEditedImage}
      />
    </div>
  );
};

export default App;