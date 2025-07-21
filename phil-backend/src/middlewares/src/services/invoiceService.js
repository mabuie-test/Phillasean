import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const invoicesDir = path.join(__dirname, '..', '..', 'invoices');
if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir);

export function generateInvoicePDF({ invoice, order }, filename) {
  const fullPath = path.join(invoicesDir, filename);
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(fullPath));
  doc.fontSize(18).text(`Fatura ${invoice.number}`, { align: 'center' });
  doc.moveDown();
  doc.text(`Cliente: ${order.name} <${order.email}>`);
  doc.text(`Serviços: ${order.services.join(', ')}`);
  doc.text(`Data do pedido: ${order.date.toLocaleDateString()}`);
  // … mais layout …
  doc.end();
}
