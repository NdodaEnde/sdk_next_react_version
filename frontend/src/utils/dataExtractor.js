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

  console.log('Extracting data from evidence object:', evidence);

  // Initialize the result object for extracted data
  const extractedData = {
    documentType,
    fields: {},
    checkboxes: {},
    tables: {},
    raw: evidence // Keep the original evidence for reference
  };

  // LandingAI API response structure is different from what we originally expected
  // Handle both the standard format and the LandingAI format

  // Check if this is a LandingAI API response structure
  const isLandingAIFormat =
    evidence &&
    typeof evidence === 'object' &&
    !Array.isArray(evidence) &&
    Object.keys(evidence).some(key => key.includes(':') && Array.isArray(evidence[key]));

  if (isLandingAIFormat) {
    console.log('Detected LandingAI evidence format');

    // Process each page of evidence in LandingAI format
    for (const [key, chunks] of Object.entries(evidence)) {
      if (!Array.isArray(chunks)) continue;

      const [filename, page] = key.split(':');
      console.log(`Processing page ${page} of ${filename}`);

      // Process each text chunk from the page
      for (const chunk of chunks) {
        // In LandingAI format, captions contain the extracted text
        if (chunk && Array.isArray(chunk.captions)) {
          for (const caption of chunk.captions) {
            processCaption(caption, extractedData);

            // Also process structured markdown content from LandingAI
            processMarkdownContent(caption, extractedData);
          }
        }
      }
    }
  } else {
    console.log('Using standard evidence format');

    // For the original format, which is a simple array of text snippets
    if (Array.isArray(evidence)) {
      for (const text of evidence) {
        processCaption(text, extractedData);
      }
    } else {
      // Try to handle nested formats with key-value pairs
      for (const [key, value] of Object.entries(evidence)) {
        if (typeof value === 'string') {
          processCaption(value, extractedData);
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'string') {
              processCaption(item, extractedData);
            } else if (item && typeof item === 'object' && item.text) {
              processCaption(item.text, extractedData);
            }
          }
        }
      }
    }
  }

  console.log('Extracted data:', extractedData);
  return extractedData;
}

/**
 * Process Markdown content from LandingAI API
 * @param {string} markdown - The markdown content from LandingAI
 * @param {Object} extractedData - The result object to populate
 */
function processMarkdownContent(markdown, extractedData) {
  if (!markdown) return;

  // Process document details section
  if (markdown.includes('## Document Details')) {
    const matches = {
      name: markdown.match(/\*\*Initials & Surname\*\*:\s*([^\n]+)/),
      id_number: markdown.match(/\*\*ID NO\*\*:\s*([^\n]+)/),
      company: markdown.match(/\*\*Company Name\*\*:\s*([^\n]+)/),
      exam_date: markdown.match(/\*\*Date of Examination\*\*:\s*([^\n]+)/),
      expiry_date: markdown.match(/\*\*Expiry Date\*\*:\s*([^\n]+)/)
    };

    for (const [field, match] of Object.entries(matches)) {
      if (match && match[1]) {
        extractedData.fields[field] = match[1].trim();
      }
    }
  }

  // Process job title
  if (markdown.includes('## Job Title')) {
    const jobMatch = markdown.match(/Job Title:\s*([^\n]+)/);
    if (jobMatch && jobMatch[1]) {
      extractedData.fields.job = jobMatch[1].trim();
    }
  }

  // Process examination type checkboxes
  if (markdown.includes('PRE-EMPLOYMENT') && markdown.includes('PERIODICAL') && markdown.includes('EXIT')) {
    if (markdown.includes('[x]') || markdown.includes('☑') || markdown.includes('☒')) {
      if (markdown.includes('PRE-EMPLOYMENT') &&
          (markdown.match(/PRE-EMPLOYMENT.*?\[x\]/s) ||
           markdown.match(/PRE-EMPLOYMENT.*?☑/s) ||
           markdown.match(/PRE-EMPLOYMENT.*?☒/s))) {
        extractedData.checkboxes.examinationType = 'pre-employment';
      } else if (markdown.includes('PERIODICAL') &&
                (markdown.match(/PERIODICAL.*?\[x\]/s) ||
                 markdown.match(/PERIODICAL.*?☑/s) ||
                 markdown.match(/PERIODICAL.*?☒/s))) {
        extractedData.checkboxes.examinationType = 'periodical';
      } else if (markdown.includes('EXIT') &&
                (markdown.match(/EXIT.*?\[x\]/s) ||
                 markdown.match(/EXIT.*?☑/s) ||
                 markdown.match(/EXIT.*?☒/s))) {
        extractedData.checkboxes.examinationType = 'exit';
      }
    }
  }

  // Process medical exams and results
  if (markdown.includes('## Medical Examination Conducted') ||
      markdown.includes('### Table Representation')) {

    // Define the medical tests we want to extract
    const medicalTests = {
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

    if (!extractedData.checkboxes.medicalExams) {
      extractedData.checkboxes.medicalExams = {};
    }

    if (!extractedData.checkboxes.medicalResults) {
      extractedData.checkboxes.medicalResults = {};
    }

    // Check for each medical test
    for (const [test, field] of Object.entries(medicalTests)) {
      // Check if test is done
      if (markdown.includes(test) &&
          (markdown.includes(`${test}.*?\\[x\\]`) ||
           markdown.match(new RegExp(`${test}.*?\\[x\\]`, 's')))) {
        extractedData.checkboxes.medicalExams[field] = true;

        // Try to extract results
        const resultRegex = new RegExp(`${test}.*?\\[x\\].*?([^\\[\\]\\n]+)`, 's');
        const resultMatch = markdown.match(resultRegex);
        if (resultMatch && resultMatch[1]) {
          extractedData.checkboxes.medicalResults[field] = resultMatch[1].trim();
        }
      }
    }
  }

  // Process restrictions
  if (markdown.includes('## Restrictions:') || markdown.includes('### Restrictions')) {
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

    if (!extractedData.checkboxes.restrictions) {
      extractedData.checkboxes.restrictions = {};
    }

    // Check if any restrictions are marked
    for (const [restriction, field] of Object.entries(restrictionTypes)) {
      if (markdown.includes(restriction)) {
        extractedData.checkboxes.restrictions[field] = true;
      }
    }
  }

  // Process fitness declaration
  if (markdown.includes('## Medical Fitness Declaration')) {
    const fitnessTypes = {
      'FIT': 'fit',
      'Fit with Restriction': 'fitWithRestriction',
      'Fit with Condition': 'fitWithCondition',
      'Temporary Unfit': 'temporaryUnfit',
      'UNFIT': 'unfit'
    };

    for (const [type, field] of Object.entries(fitnessTypes)) {
      if (markdown.includes(type) &&
          (markdown.includes(`${type}.*?\\[x\\]`) ||
           markdown.match(new RegExp(`${type}.*?\\[x\\]`, 's')) ||
           markdown.includes('crossed-out text'))) {
        extractedData.checkboxes.fitnessDeclaration = field;
        break;
      }
    }
  }
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