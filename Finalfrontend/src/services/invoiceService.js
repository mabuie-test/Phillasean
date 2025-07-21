// src/services/invoiceService.js
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Agora apontamos PARA A PASTA raiz: "../invoices"
const invoicesDir = path.join(__dirname, '..', '..', 'invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

export function generateInvoicePDF(invoiceData, filename) {
  const fullPath = path.join(invoicesDir, filename);
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(fullPath));
  doc.fontSize(20).text(`Factura Nº ${invoiceData.number}`, { align: 'center' });
  // … resto do layout …
  doc.end();
  return fullPath;
}
