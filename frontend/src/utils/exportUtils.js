/**
 * Utility functions for exporting certificate data in various formats
 */
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate a filename based on certificate data and format
 * @param {Object} data - Certificate data
 * @param {string} format - File format (e.g., 'json', 'pdf')
 * @returns {string} Generated filename
 */
export const generateFilename = (data, format) => {
  const patientName = data.name?.replace(/\s+/g, '_') || 'certificate';
  const date = new Date().toISOString().split('T')[0];
  return `${patientName}_${date}.${format}`;
};

/**
 * Export certificate data as JSON
 * @param {Object} data - Certificate data to export
 * @returns {void}
 */
export const exportAsJSON = (data) => {
  if (!data) {
    console.error('No data provided for JSON export');
    return;
  }

  try {
    // Create a formatted JSON string
    const jsonString = JSON.stringify(data, null, 2);
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(jsonString)}`;
    
    // Create a download link
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', generateFilename(data, 'json'));
    document.body.appendChild(downloadAnchorNode); // Required for Firefox
    
    // Trigger download
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  } catch (error) {
    console.error('Error exporting JSON:', error);
    alert('Failed to export data as JSON');
  }
};

/**
 * Export certificate data as PDF
 * @param {Object} data - Certificate data to export
 * @returns {void}
 */
export const exportAsPDF = (data) => {
  if (!data) {
    console.error('No data provided for PDF export');
    return;
  }

  try {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Certificate of Fitness', 105, 20, { align: 'center' });
    
    // Add timestamp
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 195, 10, { align: 'right' });
    
    // Add patient information section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Patient Information', 14, 35);
    
    doc.setFontSize(11);
    const patientInfo = [
      ['Name', data.name || 'N/A'],
      ['ID Number', data.id_number || 'N/A'],
      ['Company', data.company || 'N/A'],
      ['Job Title', data.job || 'N/A'],
      ['Examination Date', data.exam_date || 'N/A'],
      ['Expiry Date', data.expiry_date || 'N/A'],
      ['Examination Type', data.examinationType || 'N/A']
    ];
    
    doc.autoTable({
      startY: 40,
      head: [['Field', 'Value']],
      body: patientInfo,
      theme: 'grid',
      headStyles: { fillColor: [66, 135, 245], textColor: [255, 255, 255] },
      styles: { cellPadding: 3 }
    });
    
    // Add medical exams section
    const lastY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Medical Examinations', 14, lastY);
    
    // Prepare medical exams data
    const medicalExams = [];
    if (data.medicalExams) {
      Object.entries(data.medicalExams).forEach(([exam, performed]) => {
        const result = data.medicalResults?.[exam] || '';
        if (performed) {
          medicalExams.push([
            exam.charAt(0).toUpperCase() + exam.slice(1).replace(/([A-Z])/g, ' $1'),
            'Yes',
            result
          ]);
        }
      });
    }
    
    if (medicalExams.length === 0) {
      medicalExams.push(['No medical exams recorded', '', '']);
    }
    
    doc.autoTable({
      startY: lastY + 5,
      head: [['Examination', 'Performed', 'Result']],
      body: medicalExams,
      theme: 'grid',
      headStyles: { fillColor: [66, 135, 245], textColor: [255, 255, 255] },
      styles: { cellPadding: 3 }
    });
    
    // Add restrictions section
    const lastY2 = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Restrictions', 14, lastY2);
    
    // Prepare restrictions data
    const restrictions = [];
    if (data.restrictions) {
      Object.entries(data.restrictions).forEach(([restriction, applied]) => {
        if (applied) {
          restrictions.push([
            restriction.charAt(0).toUpperCase() + restriction.slice(1).replace(/([A-Z])/g, ' $1')
          ]);
        }
      });
    }
    
    if (restrictions.length === 0) {
      restrictions.push(['No restrictions applied']);
    }
    
    doc.autoTable({
      startY: lastY2 + 5,
      head: [['Applied Restrictions']],
      body: restrictions,
      theme: 'grid',
      headStyles: { fillColor: [66, 135, 245], textColor: [255, 255, 255] },
      styles: { cellPadding: 3 }
    });
    
    // Add fitness declaration
    const lastY3 = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Fitness Declaration', 14, lastY3);
    
    // Format fitness declaration value
    let fitnessDeclaration = data.fitnessDeclaration || 'Unknown';
    fitnessDeclaration = fitnessDeclaration.charAt(0).toUpperCase() + 
      fitnessDeclaration.slice(1).replace(/([A-Z])/g, ' $1');
    
    doc.autoTable({
      startY: lastY3 + 5,
      head: [['Declaration']],
      body: [[fitnessDeclaration]],
      theme: 'grid',
      headStyles: { fillColor: [66, 135, 245], textColor: [255, 255, 255] },
      styles: { cellPadding: 3 }
    });
    
    // Add comments if available
    if (data.comments) {
      const lastY4 = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('Comments', 14, lastY4);
      
      doc.autoTable({
        startY: lastY4 + 5,
        head: [['Comments']],
        body: [[data.comments]],
        theme: 'grid',
        headStyles: { fillColor: [66, 135, 245], textColor: [255, 255, 255] },
        styles: { cellPadding: 3 }
      });
    }
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        'This certificate was generated automatically and may require verification.',
        105, 
        doc.internal.pageSize.height - 10, 
        { align: 'center' }
      );
      doc.text(
        `Page ${i} of ${pageCount}`, 
        195, 
        doc.internal.pageSize.height - 10, 
        { align: 'right' }
      );
    }
    
    // Save the PDF with a dynamic filename
    doc.save(generateFilename(data, 'pdf'));
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Failed to export data as PDF');
  }
};

/**
 * Export certificate data in the specified format
 * @param {Object} data - Certificate data to export
 * @param {string} format - Export format ('json' or 'pdf')
 * @returns {void}
 */
export const exportCertificate = (data, format = 'pdf') => {
  if (!data) {
    console.error('No data provided for export');
    return;
  }

  switch (format.toLowerCase()) {
    case 'json':
      exportAsJSON(data);
      break;
    case 'pdf':
      exportAsPDF(data);
      break;
    default:
      console.error(`Unsupported export format: ${format}`);
      alert(`Unsupported export format: ${format}`);
  }
};

export default {
  exportAsJSON,
  exportAsPDF,
  exportCertificate,
  generateFilename
};