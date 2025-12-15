import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { ProcessedItem, PdfSettings } from "../types";

// Helper to compress image using Canvas
const compressImage = (base64Str: string, quality: number): Promise<string> => {
  return new Promise((resolve) => {
    if (quality >= 1) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
          resolve(base64Str);
          return;
      }
      
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

const createPdfDoc = async (items: ProcessedItem[], settings: PdfSettings): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: settings.orientation,
    unit: "mm",
    format: settings.pageSize,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxContentWidth = pageWidth - (margin * 2);
  const maxContentHeight = pageHeight - (margin * 2);

  // We loop through items. Logic differs for Images vs Docs.
  
  let isFirstPage = true;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Start a new page for each new file item (unless it's the very first one)
    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;

    if (item.type === 'image' && item.previewUrl) {
        // --- IMAGE HANDLING ---
        const imageData = await compressImage(item.previewUrl, settings.quality);
        const imgWidth = item.width || 100;
        const imgHeight = item.height || 100;
        const imgRatio = imgWidth / imgHeight;
        
        let finalWidth = maxContentWidth;
        let finalHeight = finalWidth / imgRatio;

        if (finalHeight > maxContentHeight) {
          finalHeight = maxContentHeight;
          finalWidth = finalHeight * imgRatio;
        }

        const textSpace = settings.includeDescriptions && item.description ? 20 : 0;
        if (settings.includeDescriptions && item.description) {
           if (finalHeight + textSpace > maxContentHeight) {
              const availableHeightForImage = maxContentHeight - textSpace;
              if (finalHeight > availableHeightForImage) {
                 finalHeight = availableHeightForImage;
                 finalWidth = finalHeight * imgRatio;
              }
           }
        }

        const x = (pageWidth - finalWidth) / 2;
        const y = margin;

        doc.addImage(imageData, "JPEG", x, y, finalWidth, finalHeight, item.id, "FAST");

        if (settings.includeDescriptions && item.description) {
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);
          const textY = y + finalHeight + 8;
          const splitText = doc.splitTextToSize(item.description, maxContentWidth);
          doc.text(splitText, pageWidth / 2, textY, { align: "center" });
        }

    } else if (item.type === 'docx' && item.textContent) {
        // --- DOCX (TEXT) HANDLING ---
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        // Add Title (Filename)
        doc.setFont("helvetica", "bold");
        doc.text(`Archivo: ${item.file.name}`, margin, margin);
        doc.setFont("helvetica", "normal");
        
        // Add Content
        const splitText = doc.splitTextToSize(item.textContent, maxContentWidth);
        // doc.text automatically handles page breaking for long text arrays
        doc.text(splitText, margin, margin + 10);

    } else if (item.type === 'xlsx' && item.tableData) {
        // --- EXCEL (TABLE) HANDLING ---
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`Archivo Excel: ${item.file.name}`, margin, margin);
        
        let lastY = margin + 8; // Start below title

        for (const sheet of item.tableData) {
            // Check if we need a new page for the Sheet Title
            if (lastY + 15 > pageHeight - margin) {
                doc.addPage();
                lastY = margin;
            }

            // Sheet Title
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0); // Ensure black text
            doc.text(`Hoja: ${sheet.name}`, margin, lastY);
            lastY += 2; 

            // Prepare Data
            const body = sheet.data.length > 1 ? sheet.data.slice(1) : [];
            const head = sheet.data.length > 0 ? [sheet.data[0]] : [];
            
            if (sheet.data.length === 0) {
                 lastY += 5;
                 doc.setFont("helvetica", "italic");
                 doc.setFontSize(9);
                 doc.setTextColor(100, 100, 100);
                 doc.text("(Hoja vacía)", margin, lastY);
                 lastY += 10;
                 continue;
            }

            // Draw Table
            autoTable(doc, {
                head: head,
                body: body,
                startY: lastY + 2,
                margin: { left: margin, right: margin, bottom: margin },
                theme: 'grid',
                headStyles: { fillColor: [34, 197, 94], textColor: 255 }, // Excel Green
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                pageBreak: 'auto',
            });
            
            // Update Y position for next loop
            lastY = (doc as any).lastAutoTable.finalY + 10;
        }
    }
  }
  return doc;
};

export const generatePdfDocument = async (items: ProcessedItem[], settings: PdfSettings): Promise<void> => {
  if (items.length === 0) return;
  const doc = await createPdfDoc(items, settings);
  doc.save("documento-convertido.pdf");
};

export const generatePdfBlobUrl = async (items: ProcessedItem[], settings: PdfSettings): Promise<string> => {
  if (items.length === 0) return "";
  const doc = await createPdfDoc(items, settings);
  return doc.output('bloburl');
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const getImageDimensions = (url: string): Promise<{width: number, height: number}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = url;
  });
};