const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

module.exports = function generateInvoicePDF(order) {
  return new Promise((resolve, reject) => {
    const filename = `invoices/invoice_${order._id}.pdf`;
    const filepath = path.join(__dirname, '..', '..', filename);
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filepath));

    doc.fontSize(20).text('FATURA', { align: 'center' });
    doc.moveDown();
    doc.text(`Cliente: ${order.name} (${order.email})`);
    doc.text(`Serviço: ${order.service}`);
    doc.text(`Data: ${order.createdAt.toLocaleString()}`);
    doc.text(`Detalhes: ${JSON.stringify(order.details)}`);
    doc.end();

    doc.on('finish', () => resolve({ pdfPath: filename }));
    doc.on('error', reject);
  });
};
