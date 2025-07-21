// src/services/invoiceService.js
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Gera um PDF de fatura com dados de invoice e order.
 * @param {{ invoice: Object, order: Object }} params
 * @param {string} filePath
 */
export function generateInvoicePDF(params, filePath) {
  const { invoice, order } = params;

  // 1) Garantir diretório
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- Cabeçalho ---
      doc
        .fontSize(20)
        .text(`Fatura Nº ${invoice.number}`, { align: 'center' })
        .moveDown(1);

      // --- Dados da Ordem ---
      doc
        .fontSize(12)
        .text(`Cliente: ${order.name}`)
        .text(`Email: ${order.email}`)
        .text(`Telefone: ${order.phone || '—'}`)
        .moveDown(0.5);

      doc
        .text(`Navio: ${order.vessel}`)
        .text(`Porto: ${order.port}`)
        .text(`Data Estimada: ${new Date(order.date).toLocaleDateString()}`)
        .moveDown(1);

      // --- Serviços Solicitados ---
      doc.fontSize(14).text('Serviços Solicitados:', { underline: true });
      order.services.forEach((svc, i) => {
        doc.fontSize(12).text(`${i + 1}. ${svc}`);
      });
      doc.moveDown(1);

      // --- Observações ---
      if (order.notes) {
        doc.fontSize(12).text('Observações:', { underline: true });
        doc.text(order.notes).moveDown(1);
      }

      // --- Datas da Fatura ---
      doc
        .fontSize(12)
        .text(`Data de Emissão: ${new Date(invoice.date).toLocaleDateString()}`)
        .text(`Vencimento: ${new Date(invoice.dueDate).toLocaleDateString()}`)
        .moveDown(2);

      // Você pode adicionar tabela de valores, totais, assinatura etc.
      // doc.text('Total: ...');

      // Finaliza
      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);

    } catch (err) {
      reject(err);
    }
  });
}
