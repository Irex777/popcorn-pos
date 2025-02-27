import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function downloadCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => 
        typeof row[header] === 'string' && row[header].includes(',') 
          ? `"${row[header]}"` 
          : row[header]
      ).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

export function downloadExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function downloadPDF(data: any[], filename: string, title: string) {
  const doc = new jsPDF();
  const headers = Object.keys(data[0]);
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 22);
  
  // Add timestamp
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  autoTable(doc, {
    head: [headers],
    body: data.map(row => headers.map(header => row[header])),
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [51, 51, 51] }
  });

  doc.save(`${filename}.pdf`);
}

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export function exportData(data: any[], format: ExportFormat, filename: string, title: string) {
  switch (format) {
    case 'csv':
      downloadCSV(data, filename);
      break;
    case 'excel':
      downloadExcel(data, filename);
      break;
    case 'pdf':
      downloadPDF(data, filename, title);
      break;
  }
}
