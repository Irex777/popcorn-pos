import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

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

export async function downloadExcel(data: any[], filename: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');
  
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);
    
    data.forEach(row => {
      worksheet.addRow(headers.map(header => row[header]));
    });
  }
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  link.click();
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

export async function exportData(data: any[], format: ExportFormat, filename: string, title: string) {
  switch (format) {
    case 'csv':
      downloadCSV(data, filename);
      break;
    case 'excel':
      await downloadExcel(data, filename);
      break;
    case 'pdf':
      downloadPDF(data, filename, title);
      break;
  }
}
