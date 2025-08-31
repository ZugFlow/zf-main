import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generateInvoicePDF = (order: any) => {
  const doc = new jsPDF();
  const invoiceNumber = `INV-${String(order.id).padStart(6, '0')}`;
  
  // Header
  doc.setFillColor(102, 51, 153);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255);
  doc.setFontSize(24);
  doc.text('ZUGFLOW SRL', 15, 20);
  doc.setFontSize(14);
  doc.text('FATTURA', 15, 32);
  
  // Company & Invoice details in two columns
  doc.setTextColor(0);
  doc.setFontSize(10);
  
  // Left column
  doc.text([
    'Via Roma 123',
    '20019 Milano (MI)',
    'Italia',
    'P.IVA: IT12345678910',
    'Tel: +39 02 1234567',
    'Email: info@zugflow.it'
  ], 15, 50);
  
  // Right column
  doc.text([
    `Fattura N°: ${invoiceNumber}`,
    `Data: ${format(new Date(order.data), 'dd/MM/yyyy')}`,
    `Scadenza: ${format(new Date(order.data), 'dd/MM/yyyy')}`,
    'Pagamento: Bonifico bancario',
    'IBAN: IT60X0542811101000000123456'
  ], 120, 50);
  
  // Client section with box
  doc.setDrawColor(102, 51, 153);
  doc.rect(15, 85, 180, 25);
  doc.setFontSize(11);
  doc.text('CLIENTE', 20, 95);
  doc.setFontSize(10);
  doc.text([
    order.nome,
    `ID Cliente: ${order.id}`,
    order.indirizzo || 'Indirizzo non specificato'
  ], 20, 105);
  
  // Items table with improved styling
  const headers = [['Descrizione', 'Quantità', 'Prezzo', 'Totale']];
  const data = [[
    order.nome,
    '1',
    `€ ${order.prezzo.toFixed(2)}`,
    `€ ${order.prezzo.toFixed(2)}`
  ]];
  
  autoTable(doc, {
    head: headers,
    body: data,
    startY: 120,
    theme: 'grid',
    headStyles: { fillColor: [102, 51, 153] },
    styles: { fontSize: 10 }
  });
  
  // Totals section with box
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setDrawColor(102, 51, 153);
  doc.rect(110, finalY - 5, 85, 35);
  
  doc.text('Subtotale:', 115, finalY + 5);
  doc.text(`€ ${order.prezzo.toFixed(2)}`, 170, finalY + 5);
  
  doc.text('IVA (22%):', 115, finalY + 15);
  doc.text(`€ ${(order.prezzo * 0.22).toFixed(2)}`, 170, finalY + 15);
  
  doc.setFontSize(12);
  doc.text('TOTALE:', 115, finalY + 25);
  doc.text(`€ ${(order.prezzo * 1.22).toFixed(2)}`, 170, finalY + 25);
  
  // Footer with payment info
  doc.setFontSize(9);
  doc.text([
    'Note:',
    `Si prega di indicare il numero fattura ${invoiceNumber} nella causale del bonifico.`,
    'Il pagamento è dovuto entro la data di scadenza indicata.'
  ], 15, finalY + 45);
  
  return doc;
};
