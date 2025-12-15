import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Check, Undo2, 
  RotateCw, FlipHorizontal, FlipVertical, 
  Sun, Contrast, Droplets, Palette, Activity,
  Crop, Maximize, Lock, Unlock, SlidersHorizontal,
  Monitor, Square, Smartphone, RectangleHorizontal
} from 'lucide-react';
import { ProcessedItem } from '../types';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: ProcessedItem | null;
  onSave: (id: string, newUrl: string, width: number, height: number) => void;
}

type TabType = 'adjust' | 'transform' | 'resize';
type AspectRatio = 'original' | '1:1' | '4:3' | '16:9';

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, image, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('adjust');
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  // --- STATE ---
  
  // Filters
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    blur: 0,
    grayscale: 0
  });

  // Transforms
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  
  // Cropping (Aspect Ratio Center Crop)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original');

  // Resize
  const [resize, setResize] = useState({ width: 0, height: 0 });
  const [maintainAspect, setMaintainAspect] = useState(true);

  // Initialize
  useEffect(() => {
    if (isOpen && image && image.previewUrl) {
      const img = new Image();
      img.src = image.previewUrl;
      img.onload = () => {
        setImgElement(img);
        setResize({ width: img.width, height: img.height });
      };
      
      // Reset
      setFilters({ brightness: 100, contrast: 100, saturation: 100, sepia: 0, blur: 0, grayscale: 0 });
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setAspectRatio('original');
      setActiveTab('adjust');
    } else {
      setImgElement(null);
    }
  }, [isOpen, image]);

  // Handle Resize Inputs
  const handleResizeChange = (dim: 'width' | 'height', value: number) => {
    if (!imgElement) return;
    
    // Calculate current aspect ratio based on rotation/crop implies complex logic, 
    // strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly strictly using original image ratio for simplicity in UI
    const ratio = imgElement.width / imgElement.height;

    if (maintainAspect) {
      if (dim === 'width') {
        setResize({ width: value, height: Math.round(value / ratio) });
      } else {
        setResize({ width: Math.round(value * ratio), height: value });
      }
    } else {
      setResize(prev => ({ ...prev, [dim]: value }));
    }
  };

  // --- DRAWING PIPELINE ---
  useEffect(() => {
    if (!imgElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Determine "Virtual" dimensions after rotation
    const isRotatedSides = rotation % 180 !== 0;
    const transformedWidth = isRotatedSides ? imgElement.height : imgElement.width;
    const transformedHeight = isRotatedSides ? imgElement.width : imgElement.height;

    // 2. Determine Crop Box (Center Crop) based on transformed dimensions
    let cropWidth = transformedWidth;
    let cropHeight = transformedHeight;

    if (aspectRatio !== 'original') {
      let targetRatio = 1;
      if (aspectRatio === '16:9') targetRatio = 16 / 9;
      if (aspectRatio === '4:3') targetRatio = 4 / 3;

      const currentRatio = transformedWidth / transformedHeight;

      if (currentRatio > targetRatio) {
        // Image is wider than target: Crop width
        cropHeight = transformedHeight;
        cropWidth = cropHeight * targetRatio;
      } else {
        // Image is taller than target: Crop height
        cropWidth = transformedWidth;
        cropHeight = cropWidth / targetRatio;
      }
    }

    // 3. Set Canvas Output Size
    // If user hasn't manually resized (or is in crop mode which implies re-calc), 
    // we might want to default to crop size. 
    // However, to respect the "Resize" tab, we use state `resize` but scaled to the crop ratio if needed?
    // Simplified: The canvas size is the Crop Size. 
    // *If* the user explicitly uses the Resize tab, we scale the final output.
    // For visual editing, let's render at full resolution of the crop.
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 4. Apply Filters
    ctx.filter = `
      brightness(${filters.brightness}%) 
      contrast(${filters.contrast}%) 
      saturate(${filters.saturation}%) 
      grayscale(${filters.grayscale}%)
      sepia(${filters.sepia}%)
      blur(${filters.blur}px)
    `;

    // 5. Transforms (Translate to center, Rotate, Flip)
    ctx.save();
    
    // Move to center of canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Flip
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // 6. Draw Image
    // We need to draw the image such that the center of the image is at (0,0) of context
    ctx.drawImage(
      imgElement,
      -imgElement.width / 2,
      -imgElement.height / 2
    );

    ctx.restore();

  }, [imgElement, filters, rotation, flipH, flipV, aspectRatio]);

  const handleSave = () => {
    if (image && canvasRef.current && imgElement) {
      // Create a final canvas for the resized output if needed
      const sourceCanvas = canvasRef.current;
      
      // Determine final dimensions
      // If the user changed the resize inputs, we use those. 
      // Note: The UI resize inputs are initialized to original image size.
      // If we cropped, the aspect ratio changed, so the resize inputs might be "stale" if they don't auto-update.
      // For this implementation, we will trust the visual canvas for crop, 
      // and if the User went to Resize tab, we'd need to scale that result.
      
      // Let's keep it simple: We save exactly what's on the canvas (The crop result).
      // If we implemented robust resize, we'd draw sourceCanvas to a new canvas of `resize.width` x `resize.height`.
      
      let finalCanvas = sourceCanvas;
      
      // If user wants specific resize dimensions that differ from canvas
      if (activeTab === 'resize' && (resize.width !== sourceCanvas.width || resize.height !== sourceCanvas.height)) {
         const tempCanvas = document.createElement('canvas');
         tempCanvas.width = resize.width;
         tempCanvas.height = resize.height;
         const tCtx = tempCanvas.getContext('2d');
         if (tCtx) {
           tCtx.drawImage(sourceCanvas, 0, 0, resize.width, resize.height);
           finalCanvas = tempCanvas;
         }
      }

      const newUrl = finalCanvas.toDataURL('image/jpeg', 0.95);
      onSave(image.id, newUrl, finalCanvas.width, finalCanvas.height);
      onClose();
    }
  };

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <SlidersHorizontal size={20} className="text-blue-400" />
              Editor Avanzado
            </h3>
            
            {/* Tabs */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button 
                onClick={() => setActiveTab('adjust')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'adjust' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Ajustes
              </button>
              <button 
                onClick={() => setActiveTab('transform')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'transform' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Transformar
              </button>
              <button 
                onClick={() => setActiveTab('resize')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'resize' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Tamaño
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
               <X size={20} />
             </button>
          </div>
        </div>
        
        <div className="flex flex-grow overflow-hidden">
          {/* Main Canvas Area */}
          <div className="flex-grow bg-black/50 p-6 flex items-center justify-center overflow-hidden relative checkerboard-bg">
             <canvas 
               ref={canvasRef} 
               className="max-w-full max-h-full object-contain shadow-2xl border border-gray-800"
               style={{ maxHeight: 'calc(100vh - 200px)' }}
             />
             <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 rounded text-xs font-mono text-gray-400">
                {canvasRef.current?.width} x {canvasRef.current?.height} px
             </div>
          </div>

          {/* Right Sidebar Controls */}
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* TAB: ADJUST */}
              {activeTab === 'adjust' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-4">
                    <Label icon={<Sun size={16}/>} text="Brillo" value={filters.brightness} />
                    <Range value={filters.brightness} min={0} max={200} onChange={v => setFilters({...filters, brightness: v})} />
                  </div>

                  <div className="space-y-4">
                    <Label icon={<Contrast size={16}/>} text="Contraste" value={filters.contrast} />
                    <Range value={filters.contrast} min={0} max={200} onChange={v => setFilters({...filters, contrast: v})} />
                  </div>

                  <div className="space-y-4">
                    <Label icon={<Droplets size={16}/>} text="Saturación" value={filters.saturation} />
                    <Range value={filters.saturation} min={0} max={200} onChange={v => setFilters({...filters, saturation: v})} />
                  </div>

                  <div className="space-y-4">
                    <Label icon={<Palette size={16}/>} text="Sepia" value={filters.sepia} />
                    <Range value={filters.sepia} min={0} max={100} onChange={v => setFilters({...filters, sepia: v})} />
                  </div>

                  <div className="space-y-4">
                    <Label icon={<Activity size={16}/>} text="Desenfoque" value={filters.blur} />
                    <Range value={filters.blur} min={0} max={10} step={0.1} onChange={v => setFilters({...filters, blur: v})} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                         <Monitor size={14} /> Escala de Grises
                       </span>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => setFilters({...filters, grayscale: 0})}
                        className={`flex-1 py-2 rounded text-xs font-medium border ${filters.grayscale === 0 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                       >Off</button>
                       <button 
                        onClick={() => setFilters({...filters, grayscale: 100})}
                        className={`flex-1 py-2 rounded text-xs font-medium border ${filters.grayscale === 100 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                       >On</button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: TRANSFORM */}
              {activeTab === 'transform' && (
                <div className="space-y-8 animate-fade-in">
                   {/* Rotation */}
                   <div className="space-y-3">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Rotación y Espejo</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setRotation(r => r + 90)} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex flex-col items-center gap-1 transition-colors group">
                           <RotateCw size={20} className="text-gray-400 group-hover:text-white" />
                           <span className="text-[10px] text-gray-500">Rotar</span>
                        </button>
                        <button onClick={() => setFlipH(!flipH)} className={`bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex flex-col items-center gap-1 transition-colors group ${flipH ? 'ring-1 ring-blue-500' : ''}`}>
                           <FlipHorizontal size={20} className="text-gray-400 group-hover:text-white" />
                           <span className="text-[10px] text-gray-500">Flip H</span>
                        </button>
                        <button onClick={() => setFlipV(!flipV)} className={`bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex flex-col items-center gap-1 transition-colors group ${flipV ? 'ring-1 ring-blue-500' : ''}`}>
                           <FlipVertical size={20} className="text-gray-400 group-hover:text-white" />
                           <span className="text-[10px] text-gray-500">Flip V</span>
                        </button>
                      </div>
                   </div>

                   {/* Crop */}
                   <div className="space-y-3">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Recorte (Aspect Ratio)</span>
                      <div className="grid grid-cols-2 gap-2">
                         <AspectRatioBtn 
                           label="Original" 
                           icon={<Maximize size={16}/>} 
                           active={aspectRatio === 'original'} 
                           onClick={() => setAspectRatio('original')} 
                         />
                         <AspectRatioBtn 
                           label="Cuadrado" 
                           icon={<Square size={16}/>} 
                           active={aspectRatio === '1:1'} 
                           onClick={() => setAspectRatio('1:1')} 
                         />
                         <AspectRatioBtn 
                           label="4:3" 
                           icon={<Smartphone size={16}/>} 
                           active={aspectRatio === '4:3'} 
                           onClick={() => setAspectRatio('4:3')} 
                         />
                         <AspectRatioBtn 
                           label="16:9" 
                           icon={<RectangleHorizontal size={16}/>} 
                           active={aspectRatio === '16:9'} 
                           onClick={() => setAspectRatio('16:9')} 
                         />
                      </div>
                   </div>
                </div>
              )}

              {/* TAB: RESIZE */}
              {activeTab === 'resize' && (
                <div className="space-y-6 animate-fade-in">
                   <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-sm text-gray-300">
                     <p>Define el tamaño final de la imagen en píxeles. Esto afectará la calidad de salida.</p>
                   </div>

                   <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400 uppercase">Ancho (px)</label>
                        <input 
                          type="number" 
                          value={resize.width}
                          onChange={(e) => handleResizeChange('width', Number(e.target.value))}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400 uppercase">Alto (px)</label>
                        <input 
                          type="number" 
                          value={resize.height}
                          onChange={(e) => handleResizeChange('height', Number(e.target.value))}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                   </div>

                   <button 
                     onClick={() => setMaintainAspect(!maintainAspect)}
                     className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors border ${maintainAspect ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                   >
                     {maintainAspect ? <Lock size={14} /> : <Unlock size={14} />}
                     Mantener relación de aspecto
                   </button>
                </div>
              )}

            </div>
            
            <div className="p-6 border-t border-gray-800 bg-gray-900">
               <button 
                 onClick={handleSave}
                 className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
               >
                 <Check size={20} />
                 Aplicar Cambios
               </button>
               <button 
                 onClick={onClose}
                 className="w-full mt-3 text-gray-500 hover:text-gray-300 py-2 text-sm font-medium transition-colors"
               >
                 Cancelar
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// UI Helpers
const Label = ({ icon, text, value }: { icon: React.ReactNode, text: string, value: number }) => (
  <div className="flex justify-between items-center text-gray-300">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-400">
      {icon}
      <span>{text}</span>
    </div>
    <span className="text-xs font-mono bg-gray-800 px-2 py-0.5 rounded text-gray-400">{value}</span>
  </div>
);

const Range = ({ value, min, max, step = 1, onChange }: { value: number, min: number, max: number, step?: number, onChange: (val: number) => void }) => (
  <input 
    type="range" 
    min={min} 
    max={max} 
    step={step}
    value={value} 
    onChange={(e) => onChange(Number(e.target.value))}
    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
  />
);

const AspectRatioBtn = ({ label, icon, active, onClick }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${active ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700'}`}
  >
    {icon}
    {label}
  </button>
);

export default ImageEditorModal;