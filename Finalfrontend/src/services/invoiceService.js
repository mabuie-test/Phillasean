// src/services/invoiceService.js
import PDFDocument from 'pdfkit';
import fs from 'fs';

export function generateInvoicePDF(invoiceData, filePath) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));
  doc.text(`Factura Nº ${invoiceData.number}`, { align: 'center' });
  // ... complete o layout com dados do cliente, items, totais ...
  doc.end();
}
