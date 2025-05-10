/**
 * Utility functions for extracting and processing data from LandingAI OCR output
 */

/**
 * Parse the evidence data from OCR output to extract structured field values
 * @param {Object} evidence - The evidence object containing OCR data
 * @param {string} documentType - The type of document being processed
 * @return {Object} Extracted field values mapped by field names
 */
export function extractDocumentData(evidence, documentType) {
  if (!evidence || Object.keys(evidence).length === 0) {
    return null;
  }

  // Initialize the result object for extracted data
  const extractedData = {
    documentType,
    fields: {},
    checkboxes: {},
    tables: {},
    raw: evidence // Keep the original evidence for reference
  };

  // Process each page of evidence
  for (const [key, chunks] of Object.entries(evidence)) {
    const [filename, page] = key.split(':');
    
    // Process each text chunk from the page
    for (const chunk of chunks) {
      // Process captions (human-readable interpretations of the text)
      for (const caption of (chunk.captions || [])) {
        processCaption(caption, extractedData);
      }
    }
  }

  return extractedData;
}

/**
 * Process a single caption string to extract field data
 * @param {string} caption - The caption text from OCR
 * @param {Object} extractedData - The result object to populate
 */
function processCaption(caption, extractedData) {
  // Handle field value pairs like "Field: Value"
  const fieldMatch = caption.match(/^([^:]+):\s*(.+)$/);
  if (fieldMatch) {
    const [, fieldName, fieldValue] = fieldMatch;
    const normalizedFieldName = normalizeFieldName(fieldName.trim());
    extractedData.fields[normalizedFieldName] = fieldValue.trim();
    return;
  }
  
  // Handle checkbox selections
  if (caption.includes('✓') || caption.includes('☑') || caption.includes('☒') || 
      caption.includes('checked') || caption.includes('selected')) {
    processCheckbox(caption, extractedData);
    return;
  }
  
  // Handle table rows (using a simple heuristic)
  if (caption.includes('|') || (caption.match(/\t/g) || []).length > 1) {
    processTableRow(caption, extractedData);
    return;
  }
}

/**
 * Process text that appears to be a checkbox selection
 * @param {string} text - The caption text
 * @param {Object} extractedData - The result object to populate
 */
function processCheckbox(text, extractedData) {
  // For certificate of fitness document
  if (extractedData.documentType?.toLowerCase().includes('certificate')) {
    // Check for examination types
    const examinationTypes = ['PRE-EMPLOYMENT', 'PERIODICAL', 'EXIT'];
    for (const type of examinationTypes) {
      if (text.includes(type) && (
        text.includes('✓') || text.includes('☑') || text.includes('☒') || 
        text.includes('checked') || text.includes('selected')
      )) {
        extractedData.checkboxes.examinationType = type.toLowerCase();
        return;
      }
    }
    
    // Check for medical examination types
    const medExamTypes = {
      'BLOODS': 'blood',
      'FAR, NEAR VISION': 'vision',
      'SIDE & DEPTH': 'depthVision',
      'NIGHT VISION': 'nightVision',
      'Hearing': 'hearing',
      'Working at Heights': 'heights',
      'Lung Function': 'lung',
      'X-Ray': 'xray',
      'Drug Screen': 'drugScreen'
    };
    
    for (const [key, value] of Object.entries(medExamTypes)) {
      if (text.includes(key) && (
        text.includes('✓') || text.includes('☑') || text.includes('☒') || 
        text.includes('Done') || text.includes('completed')
      )) {
        if (!extractedData.checkboxes.medicalExams) {
          extractedData.checkboxes.medicalExams = {};
        }
        extractedData.checkboxes.medicalExams[value] = true;
        
        // Try to extract results if available
        const resultMatch = text.match(/Results?:?\s*(.+)$/i);
        if (resultMatch) {
          if (!extractedData.checkboxes.medicalResults) {
            extractedData.checkboxes.medicalResults = {};
          }
          extractedData.checkboxes.medicalResults[value] = resultMatch[1].trim();
        }
        
        return;
      }
    }
    
    // Check for fitness declaration
    const fitnessTypes = {
      'FIT': 'fit',
      'Fit with Restriction': 'fitWithRestriction',
      'Fit with Condition': 'fitWithCondition',
      'Temporary Unfit': 'temporaryUnfit',
      'UNFIT': 'unfit'
    };
    
    for (const [key, value] of Object.entries(fitnessTypes)) {
      if (text.includes(key) && (
        text.includes('✓') || text.includes('☑') || text.includes('☒') || 
        text.includes('selected') || text.includes('marked')
      )) {
        extractedData.checkboxes.fitnessDeclaration = value;
        return;
      }
    }
    
    // Check for restrictions
    const restrictionTypes = {
      'Heights': 'heights',
      'Dust Exposure': 'dust',
      'Motorized Equipment': 'motorized',
      'Wear Hearing Protection': 'hearingProtection',
      'Confined Spaces': 'confinedSpaces',
      'Chemical Exposure': 'chemical',
      'Wear Spectacles': 'spectacles',
      'Remain on Treatment': 'treatment'
    };
    
    for (const [key, value] of Object.entries(restrictionTypes)) {
      if (text.includes(key) && (
        text.includes('✓') || text.includes('☑') || text.includes('☒') || 
        text.includes('checked') || text.includes('restricted')
      )) {
        if (!extractedData.checkboxes.restrictions) {
          extractedData.checkboxes.restrictions = {};
        }
        extractedData.checkboxes.restrictions[value] = true;
        return;
      }
    }
  }
}

/**
 * Process text that appears to be a table row
 * @param {string} text - The caption text
 * @param {Object} extractedData - The result object to populate
 */
function processTableRow(text, extractedData) {
  // Simple table parsing based on | or tabs
  const cells = text.includes('|') 
    ? text.split('|').map(cell => cell.trim())
    : text.split(/\t+/).map(cell => cell.trim());
  
  if (cells.length < 2) return; // Not a valid table row
  
  // Try to identify which table this belongs to
  let tableId = 'unknown';
  
  // Check for medical examination table
  if (cells.some(cell => ['BLOODS', 'Hearing', 'Vision', 'X-Ray'].includes(cell))) {
    tableId = 'medicalExams';
  }
  // Other table identifications can be added here
  
  // Add the row to the appropriate table
  if (!extractedData.tables[tableId]) {
    extractedData.tables[tableId] = [];
  }
  
  extractedData.tables[tableId].push(cells);
}

/**
 * Normalize field names for consistent mapping
 * @param {string} fieldName - The raw field name from OCR
 * @return {string} Normalized field name
 */
function normalizeFieldName(fieldName) {
  // Convert to lowercase and remove special characters
  const normalized = fieldName.toLowerCase()
    .replace(/[&\\/#,+()$~%.'":*?<>{}]/g, '')
    .replace(/\s+/g, '_');
  
  // Map common variations to consistent field names
  const fieldMappings = {
    'initials_surname': 'name',
    'initials__surname': 'name',
    'id_no': 'id_number',
    'identification_number': 'id_number',
    'company_name': 'company',
    'company': 'company',
    'date_of_examination': 'exam_date',
    'examination_date': 'exam_date',
    'expiry_date': 'expiry_date',
    'job_title': 'job',
    'position': 'job',
    'review_date': 'review_date',
    'comments': 'comments'
  };
  
  return fieldMappings[normalized] || normalized;
}

/**
 * Map extracted data to certificate fields
 * @param {Object} extractedData - The extracted data object
 * @return {Object} Data ready for certificate template population
 */
export function mapToCertificateFields(extractedData) {
  if (!extractedData) return null;
  
  // Create a template-ready object with all possible fields
  const certificateData = {
    // Employee details
    name: extractedData.fields.name || '',
    id_number: extractedData.fields.id_number || '',
    company: extractedData.fields.company || '',
    exam_date: extractedData.fields.exam_date || '',
    expiry_date: extractedData.fields.expiry_date || '',
    job: extractedData.fields.job || '',
    
    // Examination type
    examination_type: extractedData.checkboxes.examinationType || '',
    
    // Medical exams
    medical_exams: extractedData.checkboxes.medicalExams || {},
    medical_results: extractedData.checkboxes.medicalResults || {},
    
    // Fitness declaration
    fitness_declaration: extractedData.checkboxes.fitnessDeclaration || '',
    
    // Restrictions
    restrictions: extractedData.checkboxes.restrictions || {},
    
    // Other fields
    referral: extractedData.fields.referral || '',
    review_date: extractedData.fields.review_date || '',
    comments: extractedData.fields.comments || ''
  };
  
  return certificateData;
}