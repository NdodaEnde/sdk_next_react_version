/**
 * Utility functions for extracting and processing data from LandingAI OCR output
 * Enhanced to use the markdown field for reliable extraction with structured data handling
 */

// Import the improved extraction functions
import * as improvedMedicalTestsExtractor from './extractMedicalTests';
import * as improvedFitnessDeclarationExtractor from './extractFitnessDeclaration';
import * as structuredDataExtractor from './structuredDataExtractor';

export function extractCertificateData(apiResponse, documentType = 'Certificate of Fitness') {
  console.log('=== Starting certificate data extraction ===');
  console.log('Document type:', documentType);

  // Initialize the certificate data object with required fields
  let certificateData = {
    name: '',
    id_number: '',
    company: '',
    exam_date: '',
    expiry_date: '',
    job: '',
    examinationType: '',
    medicalExams: {},
    medicalResults: {},
    restrictions: {},
    fitnessDeclaration: '',
    referral: '',
    review_date: '',
    comments: '',
    documentType
  };

  // Check if markdown field exists in the response
  if (!apiResponse || !apiResponse.markdown) {
    console.warn('No markdown field found in API response, falling back to evidence parsing');
    return fallbackToEvidenceExtraction(apiResponse, certificateData);
  }

  // Try structured data extraction first (more robust)
  console.log('Attempting structured data extraction approach');
  try {
    certificateData = structuredDataExtractor.extractStructuredDataFromMarkdown(apiResponse.markdown);
    certificateData.documentType = documentType;
    console.log('Structured data extraction completed successfully');
    console.log('Extraction results:', {
      personalInfo: {
        name: certificateData.name,
        id_number: certificateData.id_number,
        company: certificateData.company,
        exam_date: certificateData.exam_date,
        expiry_date: certificateData.expiry_date,
        job: certificateData.job
      },
      examType: certificateData.examinationType,
      fitnessDeclaration: certificateData.fitnessDeclaration,
      medicalExams: Object.keys(certificateData.medicalExams || {}).length,
      restrictions: Object.keys(certificateData.restrictions || {}).length
    });
  } catch (error) {
    console.warn('Error during structured extraction, falling back to direct extraction:', error.message);
    // Fall back to the direct markdown extraction approach
    console.log('Using direct markdown extraction');
    certificateData = extractDataFromMarkdown(apiResponse.markdown);
    certificateData.documentType = documentType;
  }

  // Clean the extracted data to remove HTML comments and fix formatting
  certificateData = cleanCertificateData(certificateData);

  // Validate the extracted data to ensure all required fields are present
  certificateData = validateCertificateData(certificateData);

  console.log('=== Certificate extraction complete ===');
  console.log('Extracted fields:', Object.keys(certificateData));
  console.log('Personal details:', {
    name: certificateData.name,
    id_number: certificateData.id_number,
    company: certificateData.company,
    job: certificateData.job,
    exam_date: certificateData.exam_date,
    expiry_date: certificateData.expiry_date
  });

  return certificateData;
}

/**
 * Extract certificate data directly from markdown using structural parsing
 * This approach parses the document structure more directly and handles sections better
 * @param {string} markdown - The markdown text to extract data from
 * @returns {Object} Extracted certificate data
 */
function extractDataFromMarkdown(markdown) {
  console.log('Starting direct extraction from markdown');
  
  // Initialize certificate data object with required fields
  const certificateData = {
    name: '',
    id_number: '',
    company: '',
    exam_date: '',
    expiry_date: '',
    job: '',
    examinationType: '',
    medicalExams: {},
    medicalResults: {},
    restrictions: {},
    fitnessDeclaration: '',
    referral: '',
    review_date: '',
    comments: ''
  };
  
  // Clean the markdown by removing HTML comments
  const cleanMarkdown = markdown.replace(/<!--[\s\S]*?-->/g, '');
  
  // Extract personal details (name, ID, company, dates)
  extractPersonalDetails(cleanMarkdown, certificateData);
  
  // Extract job title
  extractJobTitle(cleanMarkdown, certificateData);
  
  // Extract examination type (PRE-EMPLOYMENT, PERIODICAL, EXIT)
  extractExaminationType(cleanMarkdown, certificateData);
  
  // Extract medical examination results
  if (typeof improvedMedicalTestsExtractor === 'function') {
    improvedMedicalTestsExtractor(cleanMarkdown, certificateData);
  } else if (improvedMedicalTestsExtractor.default) {
    improvedMedicalTestsExtractor.default(cleanMarkdown, certificateData);
  } else {
    // Try to find the right export
    console.log('Using extracted medical test function');
    const extractFn = Object.values(improvedMedicalTestsExtractor)[0];
    if (typeof extractFn === 'function') {
      extractFn(cleanMarkdown, certificateData);
    } else {
      console.warn('Could not find medical tests extractor function');
      extractMedicalTests(cleanMarkdown, certificateData);
    }
  }
  
  // Extract referral information
  extractReferral(cleanMarkdown, certificateData);
  
  // Extract review date
  extractReviewDate(cleanMarkdown, certificateData);
  
  // Extract restrictions
  extractRestrictions(cleanMarkdown, certificateData);
  
  // Extract fitness declaration using improved extractor
  if (typeof improvedFitnessDeclarationExtractor === 'function') {
    improvedFitnessDeclarationExtractor(cleanMarkdown, certificateData, isNearbyInText, extractSectionByHeader);
  } else if (improvedFitnessDeclarationExtractor.default) {
    improvedFitnessDeclarationExtractor.default(cleanMarkdown, certificateData, isNearbyInText, extractSectionByHeader);
  } else {
    // Try to find the right export
    console.log('Using extracted fitness declaration function');
    const extractFn = Object.values(improvedFitnessDeclarationExtractor)[0];
    if (typeof extractFn === 'function') {
      extractFn(cleanMarkdown, certificateData, isNearbyInText, extractSectionByHeader);
    } else {
      console.warn('Could not find fitness declaration extractor function');
      extractFitnessDeclaration(cleanMarkdown, certificateData);
    }
  }
  
  // Extract comments
  extractComments(cleanMarkdown, certificateData);
  
  return certificateData;
}

/**
 * Extract personal details from markdown
 * @param {string} markdown - The markdown text
 * @param {Object} certificateData - The certificate data to update
 */
function extractPersonalDetails(markdown, certificateData) {
  // Look for a medical examination form section that contains all personal details
  const formSection = markdown.match(/## Medical Examination Form\s*([\s\S]*?)(?:###|$)/i);

  if (formSection) {
    // Try to extract all personal details from the form section
    const formContent = formSection[1];

    // Extract name from form section
    const nameMatch = formContent.match(/\*\*Initials & Surname\*\*:\s*(.+?)(?:\n|$)/i);
    if (nameMatch && nameMatch[1] && nameMatch[1].trim() !== '') {
      certificateData.name = nameMatch[1].trim();
      console.log('Found name from form section:', certificateData.name);
    }

    // Extract ID number from form section
    const idMatch = formContent.match(/\*\*ID NO\*\*:\s*(.+?)(?:\n|$)/i);
    if (idMatch && idMatch[1] && idMatch[1].trim() !== '') {
      certificateData.id_number = idMatch[1].trim();
      console.log('Found ID number from form section:', certificateData.id_number);
    }

    // Extract company from form section
    const companyMatch = formContent.match(/\*\*Company Name\*\*:\s*(.+?)(?:\n|$)/i);
    if (companyMatch && companyMatch[1] && companyMatch[1].trim() !== '') {
      certificateData.company = companyMatch[1].trim();
      console.log('Found company from form section:', certificateData.company);
    }

    // Extract exam date from form section
    const examDateMatch = formContent.match(/\*\*Date of Examination\*\*:\s*(.+?)(?:\n|$)/i);
    if (examDateMatch && examDateMatch[1] && examDateMatch[1].trim() !== '') {
      certificateData.exam_date = examDateMatch[1].trim();
      console.log('Found exam date from form section:', certificateData.exam_date);
    }

    // Extract expiry date from form section
    const expiryMatch = formContent.match(/\*\*Expiry Date\*\*:\s*(.+?)(?:\n|$)/i);
    if (expiryMatch && expiryMatch[1] && expiryMatch[1].trim() !== '') {
      certificateData.expiry_date = expiryMatch[1].trim();
      console.log('Found expiry date from form section:', certificateData.expiry_date);
    }

    // Extract job title from form section
    const jobMatch = formContent.match(/\*\*Job Title\*\*:\s*(.+?)(?:\n|$)/i);
    if (jobMatch && jobMatch[1] && jobMatch[1].trim() !== '') {
      certificateData.job = jobMatch[1].trim();
      console.log('Found job title from form section:', certificateData.job);
    }
  }

  // If we couldn't find the details in the form section, try individual key-value pairs
  // Extract name (Initials & Surname)
  if (!certificateData.name) {
    const namePatterns = [
      /\*\*Initials & Surname\*\*:\s*(.+?)(?:\n|$)/i,
      /\*\*Name\*\*:\s*(.+?)(?:\n|$)/i,
      /Initials & Surname:\s*(.+?)(?:\n|$)/i,
      /Name:\s*(.+?)(?:\n|$)/i,
      /employee:\s*(.+?)(?:\n|$)/i,
      /## Key-Value Pair\s*\n\s*Initials & Surname:\s*(.+?)(?:\n|$)/i,
      /## Key-Value Pair\s*\n\s*Name:\s*(.+?)(?:\n|$)/i
    ];

    for (const pattern of namePatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        certificateData.name = match[1].trim();
        console.log('Found name:', certificateData.name);
        break;
      }
    }
  }

  // Extract ID number
  if (!certificateData.id_number) {
    const idPatterns = [
      /\*\*ID NO\*\*:\s*(.+?)(?:\n|$)/i,
      /\*\*ID Number\*\*:\s*(.+?)(?:\n|$)/i,
      /ID NO:\s*(.+?)(?:\n|$)/i,
      /ID Number:\s*(.+?)(?:\n|$)/i,
      /## Key-Value Pair\s*\n\s*ID NO:\s*(.+?)(?:\n|$)/i
    ];

    for (const pattern of idPatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        certificateData.id_number = match[1].trim();
        console.log('Found ID number:', certificateData.id_number);
        break;
      }
    }
  }

  // Extract company name
  if (!certificateData.company) {
    const companyPatterns = [
      /\*\*Company Name\*\*:\s*(.+?)(?:\n|$)/i,
      /\*\*Company\*\*:\s*(.+?)(?:\n|$)/i,
      /Company Name:\s*(.+?)(?:\n|$)/i,
      /Company:\s*(.+?)(?:\n|$)/i,
      /## Key-Value Pair\s*\n\s*Company Name:\s*(.+?)(?:\n|$)/i
    ];

    for (const pattern of companyPatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        certificateData.company = match[1].trim();
        console.log('Found company:', certificateData.company);
        break;
      }
    }
  }

  // Extract examination date
  if (!certificateData.exam_date) {
    const examDatePatterns = [
      /\*\*Date of Examination\*\*:\s*(.+?)(?:\n|$)/i,
      /\*\*Exam Date\*\*:\s*(.+?)(?:\n|$)/i,
      /Date of Examination:\s*(.+?)(?:\n|$)/i,
      /Exam Date:\s*(.+?)(?:\n|$)/i,
      /## Key-Value Pair\s*\n\s*Date of Examination:\s*(.+?)(?:\n|$)/i
    ];

    for (const pattern of examDatePatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        certificateData.exam_date = match[1].trim();
        console.log('Found examination date:', certificateData.exam_date);
        break;
      }
    }
  }

  // Extract expiry date
  if (!certificateData.expiry_date) {
    const expiryDatePatterns = [
      /\*\*Expiry Date\*\*:\s*(.+?)(?:\n|$)/i,
      /\*\*Valid Until\*\*:\s*(.+?)(?:\n|$)/i,
      /Expiry Date:\s*(.+?)(?:\n|$)/i,
      /Valid Until:\s*(.+?)(?:\n|$)/i,
      /## Expiry Date\s*\n\s*Expiry Date:\s*(.+?)(?:\n|$)/i
    ];

    for (const pattern of expiryDatePatterns) {
      const match = markdown.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        certificateData.expiry_date = match[1].trim();
        console.log('Found expiry date:', certificateData.expiry_date);
        break;
      }
    }
  }

  // Extract job title if not already found
  if (!certificateData.job) {
    extractJobTitle(markdown, certificateData);
  }
}

/**
 * Extract job title from markdown
 * @param {string} markdown - The markdown text
 * @param {Object} certificateData - The certificate data to update
 */
function extractJobTitle(markdown, certificateData) {
  // Look for job title section
  const jobTitlePatterns = [
    /## Job Title\s*\n\s*(.+?)(?:\n|$)/i,
    /\*\*Job Title\*\*:\s*(.+?)(?:\n|$)/i,
    /Job Title:\s*(.+?)(?:\n|$)/i,
    /\*\*Position\*\*:\s*(.+?)(?:\n|$)/i,
    /Position:\s*(.+?)(?:\n|$)/i,
    /## Key-Value Pair\s*\n\s*Job Title:\s*(.+?)(?:\n|$)/i
  ];

  for (const pattern of jobTitlePatterns) {
    const match = markdown.match(pattern);
    if (match && match[1] && match[1].trim() !== '') {
      certificateData.job = match[1].trim();
      console.log('Found job title:', certificateData.job);
      break;
    }
  }
}

/**
 * Extract examination type from markdown
 * @param {string} markdown - The markdown text
 * @param {Object} certificateData - The certificate data to update
 */
function extractExaminationType(markdown, certificateData) {
  // First try to find HTML table with examination types
  const tablePattern = /<table>[\s\S]*?PRE-EMPLOYMENT[\s\S]*?PERIODICAL[\s\S]*?EXIT[\s\S]*?<\/table>/i;
  const tableMatch = markdown.match(tablePattern);
  
  if (tableMatch) {
    const tableContent = tableMatch[0];
    
    // Check for [x] or ✓ markers in the table
    // PRE-EMPLOYMENT
    if ((tableContent.includes('[x]') && 
         countOccurrencesBetween(tableContent, 'PRE-EMPLOYMENT', '</th>', '[x]') === 0 &&
         countOccurrencesBetween(tableContent, '<td>', '</td>', '[x]') > 0) ||
        (tableContent.includes('✓') && 
         countOccurrencesBetween(tableContent, 'PRE-EMPLOYMENT', '</th>', '✓') === 0 &&
         countOccurrencesBetween(tableContent, '<td>', '</td>', '✓') > 0)) {
      certificateData.examinationType = 'pre-employment';
      console.log('Found examination type from table: pre-employment');
    }
    // PERIODICAL
    else if ((tableContent.includes('[x]') && 
              countOccurrencesBetween(tableContent, 'PERIODICAL', '</th>', '[x]') === 0 &&
              countOccurrencesBetween(tableContent, '<td>', '</td>', '[x]') > 0) ||
             (tableContent.includes('✓') && 
              countOccurrencesBetween(tableContent, 'PERIODICAL', '</th>', '✓') === 0 &&
              countOccurrencesBetween(tableContent, '<td>', '</td>', '✓') > 0)) {
      certificateData.examinationType = 'periodical';
      console.log('Found examination type from table: periodical');
    }
    // EXIT
    else if ((tableContent.includes('[x]') && 
              countOccurrencesBetween(tableContent, 'EXIT', '</th>', '[x]') === 0 &&
              countOccurrencesBetween(tableContent, '<td>', '</td>', '[x]') > 0) ||
             (tableContent.includes('✓') && 
              countOccurrencesBetween(tableContent, 'EXIT', '</th>', '✓') === 0 &&
              countOccurrencesBetween(tableContent, '<td>', '</td>', '✓') > 0)) {
      certificateData.examinationType = 'exit';
      console.log('Found examination type from table: exit');
    }
    
    // If we couldn't determine from [x] or ✓, check the table description
    if (!certificateData.examinationType) {
      if (tableContent.includes('PRE-EMPLOYMENT') && 
          (tableContent.includes('is selected') || 
           tableContent.includes('checkbox is filled') ||
           tableContent.includes('is marked') ||
           tableContent.includes('indicating it is selected'))) {
        certificateData.examinationType = 'pre-employment';
        console.log('Found examination type from table description: pre-employment');
      }
      else if (tableContent.includes('PERIODICAL') && 
               (tableContent.includes('is selected') || 
                tableContent.includes('checkbox is filled') ||
                tableContent.includes('is marked') ||
                tableContent.includes('indicating it is selected'))) {
        certificateData.examinationType = 'periodical';
        console.log('Found examination type from table description: periodical');
      }
      else if (tableContent.includes('EXIT') && 
               (tableContent.includes('is selected') || 
                tableContent.includes('checkbox is filled') ||
                tableContent.includes('is marked') ||
                tableContent.includes('indicating it is selected'))) {
        certificateData.examinationType = 'exit';
        console.log('Found examination type from table description: exit');
      }
    }
  }
  
  // If we still couldn't find the examination type, try form sections
  if (!certificateData.examinationType) {
    const formPattern = /### Table Representation[\s\S]*?<\/table>[\s\S]*?### Description/i;
    const formMatch = markdown.match(formPattern);
    
    if (formMatch) {
      const formContent = formMatch[0];
      
      if (formContent.includes('PRE-EMPLOYMENT') && 
          (formContent.includes('[x]') || 
           formContent.includes('is selected') ||
           formContent.includes('is filled') ||
           formContent.includes('is marked'))) {
        certificateData.examinationType = 'pre-employment';
        console.log('Found examination type from form description: pre-employment');
      }
      else if (formContent.includes('PERIODICAL') && 
               (formContent.includes('[x]') || 
                formContent.includes('is selected') ||
                formContent.includes('is filled') ||
                formContent.includes('is marked'))) {
        certificateData.examinationType = 'periodical';
        console.log('Found examination type from form description: periodical');
      }
      else if (formContent.includes('EXIT') && 
               (formContent.includes('[x]') || 
                formContent.includes('is selected') ||
                formContent.includes('is filled') ||
                formContent.includes('is marked'))) {
        certificateData.examinationType = 'exit';
        console.log('Found examination type from form description: exit');
      }
    }
  }
}

/**
 * Count occurrences of a substring between two markers
 * @param {string} text - Text to search in
 * @param {string} startMarker - Start marker
 * @param {string} endMarker - End marker
 * @param {string} substring - Substring to count
 * @returns {number} Number of occurrences
 */
function countOccurrencesBetween(text, startMarker, endMarker, substring) {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return 0;
  
  const endIndex = text.indexOf(endMarker, startIndex);
  if (endIndex === -1) return 0;
  
  const segment = text.substring(startIndex, endIndex);
  
  // Count occurrences
  let count = 0;
  let pos = segment.indexOf(substring);
  while (pos !== -1) {
    count++;
    pos = segment.indexOf(substring, pos + 1);
  }
  
  return count;
}

/**
 * Extract medical tests from markdown with robust checkbox detection
 * @param {string} markdown - The markdown text
 * @param {Object} certificateData - The certificate data to update
 */
function extractMedicalTests(markdown, certificateData) {
  // Initialize objects if needed
  if (!certificateData.medicalExams) certificateData.medicalExams = {};
  if (!certificateData.medicalResults) certificateData.medicalResults = {};
  
  // Map test names to standardized field names
  const testMapping = {
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
  
  // Find tables containing test results
  const tablePattern = /<table>[\s\S]*?<\/table>/g;
  let tableMatch;
  
  while ((tableMatch = tablePattern.exec(markdown)) !== null) {
    const tableContent = tableMatch[0];
    
    // Check if this table contains medical tests
    const hasMedicalTests = Object.keys(testMapping).some(test => tableContent.includes(test));
    
    if (hasMedicalTests || tableContent.includes('Done') || tableContent.includes('Results')) {
      // For each known test type, check if it's in the table and extract info
      Object.entries(testMapping).forEach(([testName, fieldName]) => {
        if (tableContent.includes(testName)) {
          // Extract the row containing this test
          const testRowPattern = new RegExp(`<tr>[\\s\\S]*?${testName}[\\s\\S]*?<\/tr>`, 'i');
          const testRowMatch = tableContent.match(testRowPattern);
          
          if (testRowMatch) {
            const testRow = testRowMatch[0];
            
            // Extract cells for Done and Results
            const cellPattern = /<td>([\s\S]*?)<\/td>/g;
            const cells = [];
            let cellMatch;
            
            while ((cellMatch = cellPattern.exec(testRow)) !== null) {
              cells.push(cellMatch[1].trim());
            }
            
            // If we have at least 2 cells (test name and Done status)
            if (cells.length >= 2) {
              // Check if test was marked as done - 2nd cell should have checkbox
              const isDone = cells[1].includes('[x]') || 
                           cells[1].includes('✓') || 
                           cells[1].includes('X') ||
                           cells[1] === 'Yes';
              
              certificateData.medicalExams[fieldName] = isDone;
              
              // If we have a result (3rd cell) and it's not N/A
              if (cells.length >= 3 && cells[2] && cells[2].trim() !== '' && cells[2].trim() !== 'N/A') {
                certificateData.medicalResults[fieldName] = cells[2].trim();
              }
              
              console.log(`Found medical test: ${testName} -> ${fieldName}, Done: ${isDone}, Result: ${certificateData.medicalResults[fieldName] || 'N/A'}`);
            }
          }
        }
      });
    }
  }
  
  // Also look for list format descriptions of tests
  const listPattern = /- \*\*([^*]+)\*\*[\s\S]*?Done: (Yes|No|\[x\]|\[ \]|\✓)[\s\S]*?Results?: ([^\n]+)/gi;
  let listMatch;
  
  while ((listMatch = listPattern.exec(markdown)) !== null) {
    const testName = listMatch[1].trim();
    const doneStatus = listMatch[2].trim();
    const result = listMatch[3].trim();
    
    // Find the corresponding field name
    let fieldName = testMapping[testName];
    if (!fieldName) {
      fieldName = testName.toLowerCase().replace(/\s+/g, '_');
    }
    
    // Determine if test was done
    const isDone = doneStatus === 'Yes' || 
                  doneStatus === '[x]' || 
                  doneStatus === '✓';
    
    // Store the data
    certificateData.medicalExams[fieldName] = isDone;
    
    // Store result if not N/A
    if (result && result !== 'N/A') {
      certificateData.medicalResults[fieldName] = result;
    }
    
    console.log(`Found medical test from list: ${testName} -> ${fieldName}, Done: ${isDone}, Result: ${result}`);
  }
}

/**
 * Extract referral information from markdown
 * @param {string} markdown - The markdown text
 * @param {Object} certificateData - The certificate data to update
 */
function extractReferral(markdown, certificateData) {
  const referralPatterns = [
    /## Referred or follow up actions:?\s*(.+?)(?=##|$)/is,
    /Referred or follow up actions:?\s*(.+?)(?=\n|$)/i
  ];
  
  for (const pattern of referralPatterns) {
    const match = markdown.match(pattern);
    if (match && match[1] && match[1].trim() !== '') {
      certificateData.referral = match[1].trim();
      console.log('Found referral:', certificateData.referral);
      break;
    }
  }
}

/**
 * Extract review date from markdown
 * @param {string} markdown - The markdown text
 * @param {Object} certificateData - The certificate data to update
 */
function extractReviewDate(markdown, certificateData) {
  const reviewDatePatterns = [
    /## Review Date:?\s*(.+?)(?=##|$)/is,
    /Review Date:?\s*(.+?)(?=\n|$)/i
  ];
  
  for (const pattern of reviewDatePatterns) {
    const match = markdown.match(pattern);
    if (match && match[1] && match[1].trim() !== '') {
      certificateData.review_date = match[1].trim();
      console.log('Found review date:', certificateData.review_date);
      break;
    }
  }
}

/**
 * Extract restrictions with accurate detection of which are applied
 * @param {string} markdown - The markdown text
 * @param {Object} certificateData - The certificate data to update
 */
function extractRestrictions(markdown, certificateData) {
  // Initialize restrictions object
  if (!certificateData.restrictions) {
    certificateData.restrictions = {};
  }
  
  // Define restriction mapping
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
  
  // Find the restrictions section
  const restrictionsPattern = /## Restrictions:[\s\S]*?(?=##|$)/i;
  const restrictionsMatch = markdown.match(restrictionsPattern);
  
  if (restrictionsMatch) {
    const restrictionsSection = restrictionsMatch[0];
    
    // Check for text indicating no restrictions are applied
    if (restrictionsSection.includes('nothing was ticked') || 
        restrictionsSection.includes('no ticks') || 
        restrictionsSection.includes('none are applied')) {
      // Set all restrictions to false
      Object.keys(restrictionTypes).forEach(restriction => {
        const fieldName = restrictionTypes[restriction];
        certificateData.restrictions[fieldName] = false;
      });
      console.log('Found explicit indication that no restrictions are applied');
      return;
    }
    
    // For each restriction type, check if it's applied
    for (const [restrictionName, fieldName] of Object.entries(restrictionTypes)) {
      if (restrictionsSection.includes(restrictionName)) {
        // Check if there's a checkmark or 'applied' indicator near this restriction
        const isApplied = (restrictionsSection.includes('✓') && restrictionName + ' ✓') ||
                          (restrictionsSection.includes('[x]') && isNearbyInText(restrictionsSection, restrictionName, '[x]', 100)) ||
                          (restrictionsSection.includes('applied:') && isNearbyInText(restrictionsSection, 'applied:', restrictionName, 200)) ||
                          (restrictionsSection.includes('marked:') && isNearbyInText(restrictionsSection, 'marked:', restrictionName, 200));
        
        // If no explicit indication, assume it's not applied
        certificateData.restrictions[fieldName] = isApplied;
        console.log(`Restriction ${restrictionName} -> ${fieldName}: ${isApplied ? 'Applied' : 'Not Applied'}`);
      } else {
        // If this restriction isn't mentioned, it's not applied
        certificateData.restrictions[fieldName] = false;
      }
    }
  } else {
    // If no restrictions section is found, set all to false
    Object.keys(restrictionTypes).forEach(restriction => {
      const fieldName = restrictionTypes[restriction];
      certificateData.restrictions[fieldName] = false;
    });
    console.log('No restrictions section found, setting all to false');
  }
}

/**
 * Check if two strings are near each other in text
 * @param {string} text - The text to search in
 * @param {string} str1 - First string to find
 * @param {string} str2 - Second string to find
 * @param {number} maxDistance - Maximum character distance
 * @returns {boolean} True if strings are within maxDistance
 */
function isNearbyInText(text, str1, str2, maxDistance) {
  const index1 = text.indexOf(str1);
  const index2 = text.indexOf(str2);
  
  if (index1 === -1 || index2 === -1) return false;
  
  return Math.abs(index1 - index2) <= maxDistance;
}

/**
 * Extract fitness declaration with robust checkbox detection
 * @param {string} markdown - The markdown text
 * @param {Object} certificateData - The certificate data to update
 */
function extractFitnessDeclaration(markdown, certificateData) {
  // Look for the medical fitness declaration section
  const fitnessPattern = /## Medical Fitness Declaration[\s\S]*?(?=##|$)/i;
  const fitnessMatch = markdown.match(fitnessPattern);
  
  if (fitnessMatch) {
    const fitnessSection = fitnessMatch[0];
    
    // Look for direct descriptions of which option is selected
    if (fitnessSection.includes('FIT') && fitnessSection.includes('is selected') ||
        fitnessSection.includes('FIT') && fitnessSection.includes('is marked with an `[x]`') ||
        fitnessSection.includes('The **FIT** option is marked')) {
      certificateData.fitnessDeclaration = 'fit';
      console.log('Found fitness declaration: fit (from description)');
    }
    else if (fitnessSection.includes('Fit with Restriction') && fitnessSection.includes('is selected') ||
             fitnessSection.includes('Fit with Restriction') && fitnessSection.includes('is marked with an `[x]`') ||
             fitnessSection.includes('The **Fit with Restriction** option is marked')) {
      certificateData.fitnessDeclaration = 'fit_with_restriction';
      console.log('Found fitness declaration: fit with restriction (from description)');
    }
    else if (fitnessSection.includes('Fit with Condition') && fitnessSection.includes('is selected') ||
             fitnessSection.includes('Fit with Condition') && fitnessSection.includes('is marked with an `[x]`') ||
             fitnessSection.includes('The **Fit with Condition** option is marked')) {
      certificateData.fitnessDeclaration = 'fit_with_condition';
      console.log('Found fitness declaration: fit with condition (from description)');
    }
    else if (fitnessSection.includes('Temporary Unfit') && fitnessSection.includes('is selected') ||
             fitnessSection.includes('Temporary Unfit') && fitnessSection.includes('is marked with an `[x]`') ||
             fitnessSection.includes('The **Temporary Unfit** option is marked')) {
      certificateData.fitnessDeclaration = 'temporary_unfit';
      console.log('Found fitness declaration: temporary unfit (from description)');
    }
    else if (fitnessSection.includes('UNFIT') && fitnessSection.includes('is selected') ||
             fitnessSection.includes('UNFIT') && fitnessSection.includes('is marked with an `[x]`') ||
             fitnessSection.includes('The **UNFIT** option is marked')) {
      certificateData.fitnessDeclaration = 'unfit';
      console.log('Found fitness declaration: unfit (from description)');
    }
    
    // If no description found, look for HTML tables with checkboxes
    if (!certificateData.fitnessDeclaration) {
      // Find tables in the fitness section
      const tablePattern = /<table>[\s\S]*?<\/table>/g;
      let tableMatch;
      
      while ((tableMatch = tablePattern.exec(fitnessSection)) !== null) {
        const tableContent = tableMatch[0];
        
        // Check which option is marked with [x] or ✓
        if (tableContent.includes('FIT') && 
            ((tableContent.includes('[x]') && isInSameRow(tableContent, 'FIT', '[x]')) ||
             (tableContent.includes('✓') && isInSameRow(tableContent, 'FIT', '✓')))) {
          certificateData.fitnessDeclaration = 'fit';
          console.log('Found fitness declaration: fit (from table)');
          break;
        }
        else if (tableContent.includes('Fit with Restriction') && 
                 ((tableContent.includes('[x]') && isInSameRow(tableContent, 'Fit with Restriction', '[x]')) ||
                  (tableContent.includes('✓') && isInSameRow(tableContent, 'Fit with Restriction', '✓')))) {
          certificateData.fitnessDeclaration = 'fit_with_restriction';
          console.log('Found fitness declaration: fit with restriction (from table)');
          break;
        }
        else if (tableContent.includes('Fit with Condition') && 
                 ((tableContent.includes('[x]') && isInSameRow(tableContent, 'Fit with Condition', '[x]')) ||
                  (tableContent.includes('✓') && isInSameRow(tableContent, 'Fit with Condition', '✓')))) {
          certificateData.fitnessDeclaration = 'fit_with_condition';
          console.log('Found fitness declaration: fit with condition (from table)');
          break;
        }
        else if (tableContent.includes('Temporary Unfit') && 
                 ((tableContent.includes('[x]') && isInSameRow(tableContent, 'Temporary Unfit', '[x]')) ||
                  (tableContent.includes('✓') && isInSameRow(tableContent, 'Temporary Unfit', '✓')))) {
          certificateData.fitnessDeclaration = 'temporary_unfit';
          console.log('Found fitness declaration: temporary unfit (from table)');
          break;
        }
        else if (tableContent.includes('UNFIT') && 
                 ((tableContent.includes('[x]') && isInSameRow(tableContent, 'UNFIT', '[x]')) ||
                  (tableContent.includes('✓') && isInSameRow(tableContent, 'UNFIT', '✓')))) {
          certificateData.fitnessDeclaration = 'unfit';
          console.log('Found fitness declaration: unfit (from table)');
          break;
        }
      }
    }
  }
  
  // Check for figures describing fitness status (like crossed-out FIT)
  if (!certificateData.fitnessDeclaration) {
    const figurePattern = /## Figure Description[\s\S]*?(?=##|$)/gi;
    let figureMatch;
    
    while ((figureMatch = figurePattern.exec(markdown)) !== null) {
      const figureContent = figureMatch[0];
      
      if (figureContent.includes('FIT') && 
          (figureContent.includes('crossed out') || 
           figureContent.includes('X that spans') || 
           figureContent.includes('negated') ||
           figureContent.includes('marked as incorrect'))) {
        certificateData.fitnessDeclaration = 'unfit';
        console.log('Found fitness declaration: unfit (from figure description)');
        break;
      }
    }
  }
}

/**
 * Check if two strings appear in the same table row
 * @param {string} tableContent - HTML table content
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {boolean} True if both strings appear in same row
 */
function isInSameRow(tableContent, str1, str2) {
  // Extract all rows from the table
  const rowPattern = /<tr>[\s\S]*?<\/tr>/g;
  let rowMatch;
  
  while ((rowMatch = rowPattern.exec(tableContent)) !== null) {
    const rowContent = rowMatch[0];
    
    // Check if both strings appear in this row
    if (rowContent.includes(str1) && rowContent.includes(str2)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract comments from markdown
 * @param {string} markdown - The markdown text
 * @param {Object} certificateData - The certificate data to update
 */
function extractComments(markdown, certificateData) {
  const commentsPatterns = [
    /## Comments:?\s*(.+?)(?=##|$)/is,
    /Comments:?\s*(.+?)(?=\n|$)/i
  ];
  
  for (const pattern of commentsPatterns) {
    const match = markdown.match(pattern);
    if (match && match[1] && match[1].trim() !== '') {
      certificateData.comments = match[1].trim();
      console.log('Found comments:', certificateData.comments);
      break;
    }
  }
}

/**
 * Extract a section by header (## Header)
 * @param {string} markdown - The markdown text
 * @param {string} header - The header to look for
 * @returns {string} The section content or empty string
 */
function extractSectionByHeader(markdown, header) {
  const pattern = new RegExp(`##\\s*${header}:?\\s*\\n([\\s\\S]*?)(?=##|$)`, 'i');
  const match = markdown.match(pattern);
  return match ? match[1].trim() : '';
}

/**
 * Extract a section containing a keyword
 * @param {string} markdown - The markdown text
 * @param {string} keyword - The keyword to look for
 * @param {number} range - Number of characters around the keyword
 * @returns {string} The section content or empty string
 */
function extractSectionByKeyword(markdown, keyword, range = 500) {
  const index = markdown.indexOf(keyword);
  if (index === -1) return '';
  
  const start = Math.max(0, index - range);
  const end = Math.min(markdown.length, index + keyword.length + range);
  
  return markdown.substring(start, end);
}

/**
 * Clean the extracted certificate data
 * @param {Object} certificateData - The certificate data to clean
 * @returns {Object} Cleaned certificate data
 */
function cleanCertificateData(certificateData) {
  // Create a deep copy to avoid modifying the original
  const cleanedData = JSON.parse(JSON.stringify(certificateData));
  
  // Clean each string field
  Object.keys(cleanedData).forEach(key => {
    if (typeof cleanedData[key] === 'string') {
      // Remove HTML comments
      cleanedData[key] = cleanedData[key].replace(/<!--[\s\S]*?-->/g, '')
        // Remove leading/trailing whitespace
        .trim()
        // Remove markdown formatting
        .replace(/\*\*/g, '');
    }
  });
  
  // Format ID number
  if (cleanedData.id_number) {
    // Remove any non-digit characters first
    const digitsOnly = cleanedData.id_number.replace(/\D/g, '');
    
    // Format South African ID (13 digits)
    if (digitsOnly.length === 13) {
      cleanedData.id_number = `${digitsOnly.substring(0, 6)} ${digitsOnly.substring(6, 10)} ${digitsOnly.substring(10)}`;
    } else {
      cleanedData.id_number = digitsOnly;
    }
  }
  
  // Format dates consistently
  if (cleanedData.exam_date) {
    cleanedData.exam_date = formatDate(cleanedData.exam_date);
  }
  
  if (cleanedData.expiry_date) {
    cleanedData.expiry_date = formatDate(cleanedData.expiry_date);
  }
  
  if (cleanedData.review_date) {
    cleanedData.review_date = formatDate(cleanedData.review_date);
  }
  
  // Clean nested objects
  if (cleanedData.medicalExams) {
    Object.keys(cleanedData.medicalExams).forEach(key => {
      if (typeof cleanedData.medicalExams[key] === 'string') {
        cleanedData.medicalExams[key] = cleanedData.medicalExams[key].replace(/<!--[\s\S]*?-->/g, '').trim();
      }
    });
  }
  
  if (cleanedData.medicalResults) {
    Object.keys(cleanedData.medicalResults).forEach(key => {
      if (typeof cleanedData.medicalResults[key] === 'string') {
        cleanedData.medicalResults[key] = cleanedData.medicalResults[key].replace(/<!--[\s\S]*?-->/g, '').trim();
      }
    });
  }
  
  if (cleanedData.restrictions) {
    Object.keys(cleanedData.restrictions).forEach(key => {
      if (typeof cleanedData.restrictions[key] === 'string') {
        cleanedData.restrictions[key] = cleanedData.restrictions[key].replace(/<!--[\s\S]*?-->/g, '').trim();
      }
    });
  }
  
  return cleanedData;
}

/**
 * Format a date string consistently
 * @param {string} dateStr - The date string to format
 * @returns {string} Formatted date string
 */
function formatDate(dateStr) {
  // Remove any non-alphanumeric characters
  const cleanDateStr = dateStr.replace(/[^0-9a-zA-Z]/g, ' ').trim();
  
  // Extract date components using regex
  const match = cleanDateStr.match(/(\d{1,2})\s*(\d{1,2})\s*(\d{2,4})/);
  
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    let year = match[3];
    
    // Handle 2-digit years
    if (year.length === 2) {
      year = parseInt(year) < 50 ? `20${year}` : `19${year}`;
    }
    
    return `${day}.${month}.${year}`;
  }
  
  return dateStr; // Return original if unable to parse
}

/**
 * Validate the certificate data to ensure all fields are present
 * @param {Object} certificateData - The certificate data to validate
 * @returns {Object} Validated certificate data
 */
function validateCertificateData(certificateData) {
  console.log('Validating certificate data...');
  
  // Check for required fields
  const requiredFields = ['name', 'id_number', 'company', 'exam_date', 'expiry_date', 'job'];
  const missingFields = requiredFields.filter(field => !certificateData[field]);
  
  if (missingFields.length > 0) {
    console.warn('Missing required fields:', missingFields);
  }
  
  // Ensure medical exams and results are properly initialized
  if (!certificateData.medicalExams) {
    certificateData.medicalExams = {};
  }
  
  if (!certificateData.medicalResults) {
    certificateData.medicalResults = {};
  }
  
  // Ensure restrictions is initialized
  if (!certificateData.restrictions) {
    certificateData.restrictions = {};
  }
  
  // Set default fitness declaration if missing
  if (!certificateData.fitnessDeclaration) {
    certificateData.fitnessDeclaration = '';
  }
  
  return certificateData;
}

/**
 * Fallback to chunks-based extraction if markdown is not available
 * @param {Object} apiResponse - The API response
 * @param {Object} certificateData - The certificate data object
 * @returns {Object} Extracted certificate data
 */
function fallbackToEvidenceExtraction(apiResponse, certificateData) {
  console.log('NOTICE: Falling back to chunks-based extraction method. Some data may be incomplete.');
  
  // Check if chunks array is available
  if (apiResponse.chunks && Array.isArray(apiResponse.chunks) && apiResponse.chunks.length > 0) {
    console.log(`Using ${apiResponse.chunks.length} chunks for extraction`);
    return extractFromChunks(apiResponse.chunks, certificateData);
  }
  
  // If no chunks, try evidence
  const evidence = apiResponse.evidence || {};
  console.log('No chunks found. Falling back to evidence with keys:', Object.keys(evidence));
  
  // Collect all text from captions for text-based extraction
  let allText = '';
  for (const [key, items] of Object.entries(evidence)) {
    if (!Array.isArray(items)) continue;
    
    items.forEach(item => {
      if (item.captions && Array.isArray(item.captions)) {
        allText += item.captions.join('\n') + '\n';
      }
    });
  }
  
  // If we have text, use it for extraction
  if (allText) {
    console.log(`Found ${allText.length} characters of text to process`);
    return extractFromText(allText, certificateData);
  }
  
  // If we get here, no usable data was found
  console.warn('WARNING: No usable data found for extraction');
  return certificateData;
}  

/**
 * Extract data from chunks array which is more structured
 * @param {Array} chunks - Array of chunks from API response
 * @param {Object} certificateData - Certificate data object to update
 * @returns {Object} Updated certificate data
 */
function extractFromChunks(chunks, certificateData) {
  // Sort chunks by type to make processing easier
  const chunksByType = {};
  
  chunks.forEach(chunk => {
    const type = chunk.chunk_type;
    if (!chunksByType[type]) {
      chunksByType[type] = [];
    }
    chunksByType[type].push(chunk);
  });
  
  console.log('Found chunk types:', Object.keys(chunksByType));
  
  // Process key-value chunks first (most reliable for basic info)
  if (chunksByType.key_value) {
    console.log(`Processing ${chunksByType.key_value.length} key-value chunks`);
    chunksByType.key_value.forEach(chunk => {
      const text = chunk.text || '';
      
      // Extract name
      if (text.includes('Initials & Surname') || text.includes('Surname')) {
        const nameMatch = text.match(/(?:Initials & Surname|Surname).*?(?::|$)\s*([^\n]+)/i);
        if (nameMatch && nameMatch[1]) {
          certificateData.name = nameMatch[1].trim();
          console.log('Extracted name from key-value:', certificateData.name);
        }
      }
      
      // Extract ID number
      if (text.includes('ID NO') || text.includes('ID Number')) {
        const idMatch = text.match(/(?:ID NO|ID Number).*?(?::|$)\s*([^\n]+)/i);
        if (idMatch && idMatch[1]) {
          certificateData.id_number = idMatch[1].trim();
          console.log('Extracted ID number from key-value:', certificateData.id_number);
        }
      }
      
      // Extract company
      if (text.includes('Company Name')) {
        const companyMatch = text.match(/Company Name.*?(?::|$)\s*([^\n]+)/i);
        if (companyMatch && companyMatch[1]) {
          certificateData.company = companyMatch[1].trim();
          console.log('Extracted company from key-value:', certificateData.company);
        }
      }
      
      // Extract dates
      if (text.includes('Date of Examination')) {
        const dateMatch = text.match(/Date of Examination.*?(?::|$)\s*([^\n]+)/i);
        if (dateMatch && dateMatch[1]) {
          certificateData.exam_date = dateMatch[1].trim();
          console.log('Extracted exam date from key-value:', certificateData.exam_date);
        }
      }
      
      if (text.includes('Expiry Date')) {
        const expiryMatch = text.match(/Expiry Date.*?(?::|$)\s*([^\n]+)/i);
        if (expiryMatch && expiryMatch[1]) {
          certificateData.expiry_date = expiryMatch[1].trim();
          console.log('Extracted expiry date from key-value:', certificateData.expiry_date);
        }
      }
      
      // Extract job title
      if (text.includes('Job Title')) {
        const jobMatch = text.match(/Job Title.*?(?::|$)\s*([^\n]+)/i);
        if (jobMatch && jobMatch[1]) {
          certificateData.job = jobMatch[1].trim();
          console.log('Extracted job title from key-value:', certificateData.job);
        }
      }
    });
  }
  
  // Process form chunks for examination type and restrictions
  if (chunksByType.form) {
    console.log(`Processing ${chunksByType.form.length} form chunks`);
    chunksByType.form.forEach(chunk => {
      const text = chunk.text || '';
      
      // Extract examination type
      if (text.includes('PRE-EMPLOYMENT') && (text.includes('[x]') || text.includes('✓'))) {
        certificateData.examinationType = 'pre-employment';
        console.log('Extracted examination type: pre-employment');
      } else if (text.includes('PERIODICAL') && (text.includes('[x]') || text.includes('✓'))) {
        certificateData.examinationType = 'periodical';
        console.log('Extracted examination type: periodical');
      } else if (text.includes('EXIT') && (text.includes('[x]') || text.includes('✓'))) {
        certificateData.examinationType = 'exit';
        console.log('Extracted examination type: exit');
      }
      
      // Extract restrictions
      if (text.includes('Restrictions')) {
        extractRestrictionsFromText(text, certificateData);
      }
      
      // Extract fitness declaration
      if (text.includes('Medical Fitness Declaration') || text.includes('FIT')) {
        extractFitnessFromText(text, certificateData);
      }
    });
  }
  
  // Process table chunks for medical tests
  if (chunksByType.table) {
    console.log(`Processing ${chunksByType.table.length} table chunks`);
    chunksByType.table.forEach(chunk => {
      const text = chunk.text || '';
      
      if (text.includes('<table>') &&
          (text.includes('Done') || text.includes('Results') || 
           text.includes('BLOODS') || text.includes('Hearing'))) {
        extractMedicalTestsFromText(text, certificateData);
      }
    });
  }
  
  // Process text chunks for any remaining info
  if (chunksByType.text) {
    console.log(`Processing ${chunksByType.text.length} text chunks`);
    chunksByType.text.forEach(chunk => {
      const text = chunk.text || '';
      
      // Extract comments
      if (text.includes('Comments:')) {
        const commentsMatch = text.match(/Comments:\s*([^\n]+)/i);
        if (commentsMatch && commentsMatch[1]) {
          certificateData.comments = commentsMatch[1].trim();
          console.log('Extracted comments:', certificateData.comments);
        }
      }
      
      // Extract referral
      if (text.includes('Referred or follow up actions:')) {
        const referralMatch = text.match(/Referred or follow up actions:\s*([^\n]+)/i);
        if (referralMatch && referralMatch[1]) {
          certificateData.referral = referralMatch[1].trim();
          console.log('Extracted referral:', certificateData.referral);
        }
      }
      
      // Extract review date
      if (text.includes('Review Date:')) {
        const reviewMatch = text.match(/Review Date:\s*([^\n]+)/i);
        if (reviewMatch && reviewMatch[1]) {
          certificateData.review_date = reviewMatch[1].trim();
          console.log('Extracted review date:', certificateData.review_date);
        }
      }
      
      // Try to extract any missing fields
      if (!certificateData.name && text.includes('Surname')) {
        const nameMatch = text.match(/(?:Initials & Surname|Surname).*?(?::|$)\s*([^\n]+)/i);
        if (nameMatch && nameMatch[1]) {
          certificateData.name = nameMatch[1].trim();
          console.log('Extracted name from text:', certificateData.name);
        }
      }
    });
  }
  
  // Fill in anything we're still missing with the figure descriptions
  if (chunksByType.figure) {
    console.log(`Processing ${chunksByType.figure.length} figure chunks as last resort`);
    // Only process these if we're missing critical fields
    if (!certificateData.name || !certificateData.id_number || !certificateData.company) {
      const allText = chunksByType.figure.map(chunk => chunk.text || '').join('\n');
      extractFromText(allText, certificateData);
    }
  }
  
  return certificateData;
}

/**
 * Extract data from plain text when no better structure is available
 * @param {string} text - Text to extract data from
 * @param {Object} certificateData - Certificate data object to update
 * @returns {Object} Updated certificate data
 */
function extractFromText(text, certificateData) {
  // Name extraction
  if (!certificateData.name) {
    // Look for name patterns in the text
    const namePatterns = [
      /(?:Initials & Surname|Surname).*?(?::|$)\s*([A-Z][A-Z\s.]+)/i,
      /name:\s*([A-Z][A-Z\s.]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        certificateData.name = match[1].trim();
        console.log('Extracted name from text:', certificateData.name);
        break;
      }
    }
  }
  
  // ID Number extraction
  if (!certificateData.id_number) {
    // South African ID format: YYMMDD NNNN NNN
    const idPatterns = [
      /ID NO.*?:\s*(\d{6}\s*\d{4}\s*\d{3})/i,
      /\b(\d{6}\s*\d{4}\s*\d{3})\b/
    ];
    
    for (const pattern of idPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        certificateData.id_number = match[1].trim();
        console.log('Extracted ID number from text:', certificateData.id_number);
        break;
      }
    }
  }
  
  // Company name extraction
  if (!certificateData.company) {
    const companyPatterns = [
      /Company Name.*?:\s*([^\n]+)/i,
      /\b(BLUECOLLAR OCC HEALTH|BLUECOLA OC HEALTH)\b/i
    ];
    
    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        certificateData.company = match[1].trim();
        console.log('Extracted company from text:', certificateData.company);
        break;
      }
    }
  }
  
  // Dates extraction
  if (!certificateData.exam_date) {
    const datePatterns = [
      /Date of Examination.*?:\s*([^\n]+)/i,
      /\b(\d{2}[-/.]\d{2}[-/.]\d{4}|\d{4}[-/.]\d{2}[-/.]\d{2}|2\d-\d{2}-2\d{3})\b/
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        certificateData.exam_date = match[1].trim();
        console.log('Extracted exam date from text:', certificateData.exam_date);
        break;
      }
    }
  }
  
  // Job title extraction
  if (!certificateData.job) {
    const jobPatterns = [
      /Job Title.*?:\s*([^\n]+)/i,
      /Position.*?:\s*([^\n]+)/i
    ];
    
    for (const pattern of jobPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        certificateData.job = match[1].trim();
        console.log('Extracted job title from text:', certificateData.job);
        break;
      }
    }
  }
  
  // Extract missing medical tests and fitness declarations
  if (text.includes('BLOODS') || text.includes('Vision') || text.includes('Hearing')) {
    extractMedicalTestsFromText(text, certificateData);
  }
  
  if (text.includes('Restrictions')) {
    extractRestrictionsFromText(text, certificateData);
  }
  
  if (text.includes('FIT')) {
    extractFitnessFromText(text, certificateData);
  }
  
  return certificateData;
}

/**
 * Extract medical tests from text
 * @param {string} text - Text to extract from
 * @param {Object} certificateData - Certificate data object to update
 */
function extractMedicalTestsFromText(text, certificateData) {
  // Initialize medical exams and results objects if they don't exist
  if (!certificateData.medicalExams) {
    certificateData.medicalExams = {};
  }
  if (!certificateData.medicalResults) {
    certificateData.medicalResults = {};
  }

  // Common test names and their corresponding field names
  const testMapping = {
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

  // For each test, look for it in the text
  Object.entries(testMapping).forEach(([testName, fieldName]) => {
    // Check if the test is mentioned
    if (text.includes(testName)) {
      // See if we can determine if it was done
      const isDone = text.includes(`${testName}`) && 
                   (text.includes('[x]') || text.includes('X') || 
                    text.includes('✓') || text.includes('done') || 
                    text.includes('performed'));
      
      certificateData.medicalExams[fieldName] = isDone;
      
      // Try to extract results
      // Look for results near the test name
      const testIndex = text.indexOf(testName);
      const nearbyText = text.substring(testIndex, testIndex + 200);
      
      // Look for common result patterns
      const resultPatterns = [
        new RegExp(`${testName}.*?(?:Results?|Value):?\\s*([^\\n,]+)`, 'i'),
        new RegExp(`${testName}.*?:\\s*([^\\n,]+)`, 'i')
      ];
      
      for (const pattern of resultPatterns) {
        const match = nearbyText.match(pattern);
        if (match && match[1] && match[1].trim() !== 'N/A') {
          certificateData.medicalResults[fieldName] = match[1].trim();
          break;
        }
      }
      
      console.log(`Extracted medical test: ${testName} -> ${fieldName}, Done: ${isDone}, Result: ${certificateData.medicalResults[fieldName] || 'N/A'}`);
    }
  });
}

/**
 * Extract restrictions from text
 * @param {string} text - Text to extract from
 * @param {Object} certificateData - Certificate data object to update
 */
function extractRestrictionsFromText(text, certificateData) {
  // Initialize restrictions object if it doesn't exist
  if (!certificateData.restrictions) {
    certificateData.restrictions = {};
  }

  // Common restriction types and their field names
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

  // Check for each restriction type in the text
  Object.entries(restrictionTypes).forEach(([restrictionName, fieldName]) => {
    if (text.includes(restrictionName)) {
      // Check if there are checkmarks near the restriction
      const isMarked = text.includes(`${restrictionName} ✓`) || 
                      text.includes(`${restrictionName}✓`) ||
                      (text.includes(restrictionName) && 
                       (text.includes('[x]') || text.includes('X')) && 
                       isNearbyInText(text, restrictionName, '[x]', 200));
      
      certificateData.restrictions[fieldName] = isMarked;
      console.log(`Extracted restriction: ${restrictionName} -> ${fieldName}, Applied: ${isMarked}`);
    }
  });
}

/**
 * Extract fitness declaration from text
 * @param {string} text - Text to extract from
 * @param {Object} certificateData - Certificate data object to update
 */
function extractFitnessFromText(text, certificateData) {
  // Look for fitness declarations
  
  // FIT
  if (text.includes('FIT') && 
      ((text.includes('[x]') && isNearbyInText(text, 'FIT', '[x]', 100)) ||
       (text.includes('✓') && isNearbyInText(text, 'FIT', '✓', 100)))) {
    certificateData.fitnessDeclaration = 'fit';
    console.log('Extracted fitness declaration: fit');
  }
  // Fit with Restriction
  else if (text.includes('Fit with Restriction') && 
           ((text.includes('[x]') && isNearbyInText(text, 'Fit with Restriction', '[x]', 100)) ||
            (text.includes('✓') && isNearbyInText(text, 'Fit with Restriction', '✓', 100)))) {
    certificateData.fitnessDeclaration = 'fit_with_restriction';
    console.log('Extracted fitness declaration: fit with restriction');
  }
  // Fit with Condition
  else if (text.includes('Fit with Condition') && 
           ((text.includes('[x]') && isNearbyInText(text, 'Fit with Condition', '[x]', 100)) ||
            (text.includes('✓') && isNearbyInText(text, 'Fit with Condition', '✓', 100)))) {
    certificateData.fitnessDeclaration = 'fit_with_condition';
    console.log('Extracted fitness declaration: fit with condition');
  }
  // Temporary Unfit
  else if (text.includes('Temporary Unfit') && 
           ((text.includes('[x]') && isNearbyInText(text, 'Temporary Unfit', '[x]', 100)) ||
            (text.includes('✓') && isNearbyInText(text, 'Temporary Unfit', '✓', 100)))) {
    certificateData.fitnessDeclaration = 'temporary_unfit';
    console.log('Extracted fitness declaration: temporary unfit');
  }
  // UNFIT
  else if (text.includes('UNFIT') && 
           ((text.includes('[x]') && isNearbyInText(text, 'UNFIT', '[x]', 100)) ||
            (text.includes('✓') && isNearbyInText(text, 'UNFIT', '✓', 100)))) {
    certificateData.fitnessDeclaration = 'unfit';
    console.log('Extracted fitness declaration: unfit');
  }
  // If no specific declaration is found, but FIT appears
  else if (text.includes('FIT')) {
    certificateData.fitnessDeclaration = 'fit';
    console.log('Assuming fitness declaration: fit (default)');
  }
}

/**
 * Map extracted data to certificate fields for the template
 * @param {Object} apiResponse - The full API response including markdown field
 * @return {Object} Data ready for certificate template population
 */
export function mapToCertificateFields(apiResponse) {
  // If the data is already in the certificate format, just return it
  if (apiResponse.name !== undefined || apiResponse.medicalExams !== undefined) {
    return apiResponse;
  }

  // Extract the certificate data using the main function that now leverages structured data extraction
  const certificateData = extractCertificateData(apiResponse);

  return certificateData;
}