// src/services/invoiceService.js
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// resolve __dirname no módulo esm
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Diretório de saída: src/services/invoices
const invoicesDir = path.join(__dirname, 'invoices');
// garante que existe
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

export function generateInvoicePDF(invoiceData, filename) {
  // monta caminho completo
  const fullPath = path.join(invoicesDir, filename);
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(fullPath));
  doc.fontSize(20).text(`Factura Nº ${invoiceData.number}`, { align: 'center' });
  // ... seu layout ...
  doc.end();
  return fullPath;
}
