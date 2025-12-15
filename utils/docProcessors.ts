import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export const processDocxFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        // Extract raw text. For HTML, we'd use convertToHtml, but pure text is safer for jsPDF currently.
        const result = await mammoth.extractRawText({ arrayBuffer });
        resolve(result.value);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
};

export const processXlsxFile = async (file: File): Promise<{ name: string; data: string[][] }[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheets = workbook.SheetNames.map(name => {
            const sheet = workbook.Sheets[name];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
            return { name, data: jsonData };
        });
        
        resolve(sheets);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
};