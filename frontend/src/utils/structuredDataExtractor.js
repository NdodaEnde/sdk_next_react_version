/**
 * Structured data extraction utilities for certificate documents
 * This module provides comprehensive extraction from markdown by content type
 */

/**
 * Main function to extract all structured data from markdown
 * Organizes extraction by content type (tables, key-values, figures, forms)
 * @param {string} markdown - The full markdown text from the API response
 * @returns {Object} Certificate data with all extracted fields
 */
function extractStructuredDataFromMarkdown(markdown) {
  // Initialize certificate data structure
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

  // Clean the markdown by removing any HTML comments
  const cleanMarkdown = markdown.replace(/<!--[\s\S]*?-->/g, '');
  
  console.log('Starting structured data extraction...');
  
  // Extract data by content type
  const tables = extractAllTables(cleanMarkdown);
  const keyValues = extractAllKeyValues(cleanMarkdown);
  const forms = extractAllForms(cleanMarkdown);
  const figures = extractAllFigures(cleanMarkdown);
  
  console.log(`Found ${tables.length} tables, ${keyValues.length} key-values, ${forms.length} forms, ${figures.length} figures`);
  
  // Process personal details from key-values first (most reliable source)
  processPersonalDetailsFromKeyValues(keyValues, certificateData);
  
  // Process examination type from forms
  processExaminationTypeFromForms(forms, certificateData);
  
  // Process medical tests from tables
  processMedicalTestsFromTables(tables, certificateData);
  
  // Process fitness declaration from forms and tables
  processFitnessDeclarationFromContent(forms, tables, certificateData);
  
  // Process restrictions from forms and tables
  processRestrictionsFromContent(forms, tables, certificateData);
  
  // Process referral and review dates
  processReferralAndReview(keyValues, certificateData);
  
  // Process comments
  processComments(keyValues, certificateData);
  
  // Fall back to direct content search for any missing fields
  processRemainingFieldsFromFullMarkdown(cleanMarkdown, certificateData);
  
  // Clean up and normalize data
  return normalizeExtractionResults(certificateData);
}

/**
 * Extract all tables from markdown content
 * @param {string} markdown - The markdown content
 * @returns {Array} Array of table objects with headers and rows
 */
function extractAllTables(markdown) {
  const tables = [];
  
  // Extract HTML tables first
  const htmlTablePattern = /<table>[\s\S]*?<\/table>/g;
  let htmlTableMatch;
  
  while ((htmlTableMatch = htmlTablePattern.exec(markdown)) !== null) {
    const tableContent = htmlTableMatch[0];
    const tableObject = parseHtmlTable(tableContent);
    
    // Record the original HTML for checkbox detection
    tableObject.originalHtml = tableContent;
    
    tables.push(tableObject);
  }
  
  // Extract markdown tables (pipe tables)
  const markdownTablePattern = /\|(.*?)\|\s*\n\|([-:|\s]*)\|\s*\n((?:\|.*?\|\s*\n)+)/g;
  let markdownTableMatch;
  
  while ((markdownTableMatch = markdownTablePattern.exec(markdown)) !== null) {
    const headerRow = markdownTableMatch[1];
    const alignmentRow = markdownTableMatch[2];
    const contentRows = markdownTableMatch[3];
    
    const tableObject = parseMarkdownTable(headerRow, contentRows);
    
    // Record the original markdown for checkbox detection
    tableObject.originalMarkdown = markdownTableMatch[0];
    
    tables.push(tableObject);
  }
  
  // Determine table types based on contents
  tables.forEach(table => {
    table.type = determineTableType(table);
  });
  
  return tables;
}

/**
 * Parse an HTML table into an object with headers and rows
 * @param {string} tableContent - The HTML table content
 * @returns {Object} Table object with headers and rows
 */
function parseHtmlTable(tableContent) {
  const headers = [];
  const rows = [];
  
  // Extract headers
  const headerPattern = /<th>([\s\S]*?)<\/th>/g;
  let headerMatch;
  
  while ((headerMatch = headerPattern.exec(tableContent)) !== null) {
    headers.push(headerMatch[1].trim());
  }
  
  // Extract rows
  const rowPattern = /<tr>(?![\s\S]*?<th>)([\s\S]*?)<\/tr>/g;
  let rowMatch;
  
  while ((rowMatch = rowPattern.exec(tableContent)) !== null) {
    const rowContent = rowMatch[1];
    const cells = [];
    
    // Extract cells
    const cellPattern = /<td>([\s\S]*?)<\/td>/g;
    let cellMatch;
    
    while ((cellMatch = cellPattern.exec(rowContent)) !== null) {
      cells.push(cellMatch[1].trim());
    }
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  return {
    format: 'html',
    headers,
    rows
  };
}

/**
 * Parse a markdown table into an object with headers and rows
 * @param {string} headerRow - The markdown table header row
 * @param {string} contentRows - The markdown table content rows
 * @returns {Object} Table object with headers and rows
 */
function parseMarkdownTable(headerRow, contentRows) {
  // Extract headers
  const headers = headerRow.split('|')
    .filter(cell => cell.trim())
    .map(cell => cell.trim());
  
  // Extract content rows
  const rows = contentRows.trim().split('\n')
    .map(row => row.split('|')
      .filter(cell => cell.trim())
      .map(cell => cell.trim())
    );
  
  return {
    format: 'markdown',
    headers,
    rows
  };
}

/**
 * Determine the type of table based on its contents
 * @param {Object} table - The table object
 * @returns {string} The determined table type
 */
function determineTableType(table) {
  const headerString = table.headers.join(' ').toLowerCase();
  const firstRowString = table.rows.length > 0 ? table.rows[0].join(' ').toLowerCase() : '';
  
  if (headerString.includes('test') && (headerString.includes('done') || headerString.includes('result'))) {
    return 'medicalTests';
  } else if (headerString.includes('fit') || firstRowString.includes('fit')) {
    return 'fitnessDeclaration';
  } else if (headerString.includes('restriction') || firstRowString.includes('restriction')) {
    return 'restrictions';
  } else if (headerString.includes('pre-employment') || headerString.includes('periodical') || headerString.includes('exit')) {
    return 'examinationType';
  } else {
    return 'unknown';
  }
}

/**
 * Extract all key-value pairs from markdown
 * @param {string} markdown - The markdown content
 * @returns {Array} Array of key-value objects
 */
function extractAllKeyValues(markdown) {
  const keyValues = [];
  
  // Look for structured key-value sections
  const sectionPattern = /## Key-Value Pair\s*\n([\s\S]*?)(?=##|$)/g;
  let sectionMatch;
  
  while ((sectionMatch = sectionPattern.exec(markdown)) !== null) {
    const sectionContent = sectionMatch[1];
    
    // Extract individual key-value pairs
    const keyValuePattern = /([^:\n]+):\s*([^\n]+)/g;
    let keyValueMatch;
    
    while ((keyValueMatch = keyValuePattern.exec(sectionContent)) !== null) {
      keyValues.push({
        key: keyValueMatch[1].trim().replace(/\*\*/g, ''),
        value: keyValueMatch[2].trim()
      });
    }
  }
  
  // Look for all key-value patterns in markdown (even outside dedicated sections)
  const keyValuePattern = /(\*\*[^:\n*]+\*\*):\s*([^\n]+)/g;
  let keyValueMatch;
  
  while ((keyValueMatch = keyValuePattern.exec(markdown)) !== null) {
    keyValues.push({
      key: keyValueMatch[1].replace(/\*\*/g, '').trim(),
      value: keyValueMatch[2].trim()
    });
  }
  
  // Look for more generic key-value patterns
  const genericKeyValuePattern = /(?:^|\n)([A-Za-z][A-Za-z &]+[A-Za-z]):\s*([^\n]+)/g;
  let genericMatch;
  
  while ((genericMatch = genericKeyValuePattern.exec(markdown)) !== null) {
    // Skip if key contains 'http' (likely a URL)
    if (!genericMatch[1].includes('http')) {
      keyValues.push({
        key: genericMatch[1].trim(),
        value: genericMatch[2].trim()
      });
    }
  }
  
  return keyValues;
}

/**
 * Extract all forms from markdown
 * @param {string} markdown - The markdown content
 * @returns {Array} Array of form objects
 */
function extractAllForms(markdown) {
  const forms = [];

  // Extract medical examination form
  const medicalFormPattern = /## Medical Examination Form\s*([\s\S]*?)(?=##|$)/i;
  const medicalFormMatch = markdown.match(medicalFormPattern);

  if (medicalFormMatch) {
    forms.push({
      type: 'medicalExamination',
      content: medicalFormMatch[1]
    });
  }

  // Extract document details section (often contains personal details)
  const docDetailsPattern = /## Document Details\s*([\s\S]*?)(?=##|$)/i;
  const docDetailsMatch = markdown.match(docDetailsPattern);

  if (docDetailsMatch) {
    forms.push({
      type: 'documentDetails',
      content: docDetailsMatch[1]
    });
  }

  // Extract fitness declaration form - try different possible headers
  const fitnessPossiblePatterns = [
    /## Medical Fitness (?:Declaration|Evaluation)\s*([\s\S]*?)(?=##|$)/i,
    /## Fitness (?:Declaration|Evaluation)\s*([\s\S]*?)(?=##|$)/i,
    /## Medical Fitness\s*([\s\S]*?)(?=##|$)/i,
    /## Fitness Declaration\s*([\s\S]*?)(?=##|$)/i,
    /## Fitness\s*([\s\S]*?)(?=##|$)/i
  ];

  for (const pattern of fitnessPossiblePatterns) {
    const fitnessMatch = markdown.match(pattern);
    if (fitnessMatch) {
      forms.push({
        type: 'fitnessDeclaration',
        content: fitnessMatch[1]
      });
      break; // Found one, no need to keep looking
    }
  }

  // Extract examination type form
  const examTypeFormPattern = /## Examination Type\s*([\s\S]*?)(?=##|$)/i;
  const examTypeFormMatch = markdown.match(examTypeFormPattern);

  if (examTypeFormMatch) {
    forms.push({
      type: 'examinationType',
      content: examTypeFormMatch[1]
    });
  }

  // Extract examination results section
  const examResultsPattern = /### Examination Results\s*([\s\S]*?)(?=###|##|$)/i;
  const examResultsMatch = markdown.match(examResultsPattern);

  if (examResultsMatch) {
    forms.push({
      type: 'examinationResults',
      content: examResultsMatch[1]
    });
  }

  // Extract restrictions form - try different patterns
  const restrictionsPossiblePatterns = [
    /## Restrictions\s*([\s\S]*?)(?=##|$)/i,
    /### Restrictions\s*([\s\S]*?)(?=###|##|$)/i,
    /## Restriction(?:s)?\s*([\s\S]*?)(?=##|$)/i
  ];

  for (const pattern of restrictionsPossiblePatterns) {
    const restrictionsMatch = markdown.match(pattern);
    if (restrictionsMatch) {
      forms.push({
        type: 'restrictions',
        content: restrictionsMatch[1]
      });
      break; // Found one, no need to keep looking
    }
  }

  // Extract any section with test results
  const testsPattern = /## (?:Medical Examination|Tests|Medical Tests)\s*([\s\S]*?)(?=##|$)/i;
  const testsMatch = markdown.match(testsPattern);

  if (testsMatch) {
    forms.push({
      type: 'medicalTests',
      content: testsMatch[1]
    });
  }

  // Check for vision tests section
  const visionTestsPattern = /#### Vision Tests\s*([\s\S]*?)(?=####|###|##|$)/i;
  const visionTestsMatch = markdown.match(visionTestsPattern);

  if (visionTestsMatch) {
    forms.push({
      type: 'visionTests',
      content: visionTestsMatch[1]
    });
  }

  // Check for other tests section
  const otherTestsPattern = /#### Other Tests\s*([\s\S]*?)(?=####|###|##|$)/i;
  const otherTestsMatch = markdown.match(otherTestsPattern);

  if (otherTestsMatch) {
    forms.push({
      type: 'otherTests',
      content: otherTestsMatch[1]
    });
  }

  return forms;
}

/**
 * Extract all figures from markdown
 * @param {string} markdown - The markdown content
 * @returns {Array} Array of figure objects
 */
function extractAllFigures(markdown) {
  const figures = [];
  
  // Extract images
  const imagePattern = /!\[(.*?)\]\((.*?)\)/g;
  let imageMatch;
  
  while ((imageMatch = imagePattern.exec(markdown)) !== null) {
    figures.push({
      type: 'image',
      alt: imageMatch[1],
      url: imageMatch[2]
    });
  }
  
  // Extract diagrams or charts
  const diagramPattern = /```(?:mermaid|graph)([\s\S]*?)```/g;
  let diagramMatch;
  
  while ((diagramMatch = diagramPattern.exec(markdown)) !== null) {
    figures.push({
      type: 'diagram',
      content: diagramMatch[1]
    });
  }
  
  return figures;
}

/**
 * Process personal details from key-value pairs
 * @param {Array} keyValues - The key-value pairs
 * @param {Object} certificateData - The certificate data to update
 */
function processPersonalDetailsFromKeyValues(keyValues, certificateData) {
  // Define field mappings for normalizing different key formats
  const fieldMappings = {
    name: ['Initials & Surname', 'Name', 'Employee', 'Full Name', 'Patient Name'],
    id_number: ['ID NO', 'ID Number', 'Identity Number', 'ID', 'National ID'],
    company: ['Company Name', 'Company', 'Employer', 'Organization'],
    exam_date: ['Date of Examination', 'Exam Date', 'Examination Date', 'Date of Medical', 'Assessment Date'],
    expiry_date: ['Expiry Date', 'Valid Until', 'Expires On', 'Expiration Date', 'Valid To'],
    job: ['Job Title', 'Position', 'Occupation', 'Designation', 'Role']
  };

  // For each field, try to find a matching key-value pair
  for (const [field, possibleKeys] of Object.entries(fieldMappings)) {
    // Check if we already have a value
    if (certificateData[field]) continue;

    // Try each possible key
    for (const key of possibleKeys) {
      const match = keyValues.find(kv => kv.key.toLowerCase() === key.toLowerCase());

      if (match && match.value && match.value.trim() !== '') {
        certificateData[field] = match.value.trim();
        console.log(`Found ${field} from key-value: ${certificateData[field]}`);
        break;
      }
    }
  }

  // If we still have missing fields, try a more flexible approach with partial matches
  const missingFields = Object.keys(fieldMappings).filter(field => !certificateData[field]);
  if (missingFields.length > 0) {
    console.log(`Trying more flexible matching for fields: ${missingFields.join(', ')}`);

    for (const field of missingFields) {
      const possibleKeys = fieldMappings[field];

      // Try partial key matching (e.g., "Name" will match "Full Name")
      for (const key of possibleKeys) {
        const partialMatches = keyValues.filter(kv =>
          kv.key.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(kv.key.toLowerCase())
        );

        for (const match of partialMatches) {
          if (match.value && match.value.trim() !== '') {
            certificateData[field] = match.value.trim();
            console.log(`Found ${field} from partial key-value match: ${certificateData[field]}`);
            break;
          }
        }

        if (certificateData[field]) break;
      }
    }
  }

  // As a last resort, look for list-style declarations for personal details
  const listPattern = /- \*\*([^*]+)\*\*: (.+)$/gm;
  let listMatch;

  while ((listMatch = listPattern.exec(keyValues.toString())) !== null) {
    const key = listMatch[1].trim();
    const value = listMatch[2].trim();

    for (const [field, possibleKeys] of Object.entries(fieldMappings)) {
      if (!certificateData[field] && possibleKeys.some(k =>
        key.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(key.toLowerCase()))) {
        certificateData[field] = value;
        console.log(`Found ${field} from list pattern: ${value}`);
        break;
      }
    }
  }
}

/**
 * Process examination type from forms
 * @param {Array} forms - The forms
 * @param {Object} certificateData - The certificate data to update
 */
function processExaminationTypeFromForms(forms, certificateData) {
  // Look for examination type forms
  const examTypeForms = forms.filter(form => form.type === 'examinationType');

  for (const form of examTypeForms) {
    const content = form.content;

    // Determine the examination type
    const examinationType = determineExaminationType(content);

    if (examinationType) {
      certificateData.examinationType = examinationType;
      console.log(`Found examination type: ${examinationType}`);
      break;
    }
  }

  // If not found in specific forms, check all forms
  if (!certificateData.examinationType) {
    for (const form of forms) {
      const content = form.content;

      // Look for examination type indicators
      if (hasCheckedItem(content, ['PRE-EMPLOYMENT', 'PRE EMPLOYMENT'])) {
        certificateData.examinationType = 'pre-employment';
        console.log('Found examination type: pre-employment');
        break;
      } else if (hasCheckedItem(content, ['PERIODICAL'])) {
        certificateData.examinationType = 'periodical';
        console.log('Found examination type: periodical');
        break;
      } else if (hasCheckedItem(content, ['EXIT'])) {
        certificateData.examinationType = 'exit';
        console.log('Found examination type: exit');
        break;
      }
    }
  }

  // If still not found, look for list styles with checkboxes
  if (!certificateData.examinationType) {
    const allFormsContent = forms.map(form => form.content).join('\n');

    // Check for patterns like "- **Pre-Employment**: [x]"
    if (allFormsContent.match(/- \*\*Pre-Employment\*\*:\s*\[x\]/i) ||
        allFormsContent.match(/- \*\*PRE-EMPLOYMENT\*\*:\s*\[x\]/i) ||
        allFormsContent.match(/- \*\*PRE EMPLOYMENT\*\*:\s*\[x\]/i)) {
      certificateData.examinationType = 'pre-employment';
      console.log('Found examination type from list style: pre-employment');
    } else if (allFormsContent.match(/- \*\*Periodical\*\*:\s*\[x\]/i) ||
               allFormsContent.match(/- \*\*PERIODICAL\*\*:\s*\[x\]/i)) {
      certificateData.examinationType = 'periodical';
      console.log('Found examination type from list style: periodical');
    } else if (allFormsContent.match(/- \*\*Exit\*\*:\s*\[x\]/i) ||
               allFormsContent.match(/- \*\*EXIT\*\*:\s*\[x\]/i)) {
      certificateData.examinationType = 'exit';
      console.log('Found examination type from list style: exit');
    }
  }
}

/**
 * Determine examination type from content
 * @param {string} content - The content to analyze
 * @returns {string|null} The examination type or null if not found
 */
function determineExaminationType(content) {
  // First try HTML table rows for clearest detection
  if (content.includes('<tr>')) {
    const rowPattern = /<tr>[\s\S]*?<\/tr>/g;
    let rowMatch;
    
    while ((rowMatch = rowPattern.exec(content)) !== null) {
      const rowContent = rowMatch[0];
      
      // Check for PRE-EMPLOYMENT
      if (rowContent.includes('PRE-EMPLOYMENT') || rowContent.includes('PRE EMPLOYMENT')) {
        if (rowContent.includes('[x]') || rowContent.includes('✓')) {
          return 'pre-employment';
        }
      }
      
      // Check for PERIODICAL
      if (rowContent.includes('PERIODICAL')) {
        if (rowContent.includes('[x]') || rowContent.includes('✓')) {
          return 'periodical';
        }
      }
      
      // Check for EXIT
      if (rowContent.includes('EXIT')) {
        if (rowContent.includes('[x]') || rowContent.includes('✓')) {
          return 'exit';
        }
      }
    }
  }
  
  // Check table cells directly
  if (content.includes('<td>')) {
    const cellPattern = /<td>([\s\S]*?)<\/td>/g;
    let cellMatch;
    const cells = [];
    
    while ((cellMatch = cellPattern.exec(content)) !== null) {
      cells.push(cellMatch[1].trim());
    }
    
    // If we have at least 3 cells in the table (probably PRE-EMPLOYMENT, PERIODICAL, EXIT)
    if (cells.length >= 3) {
      const headerPattern = /<th>([\s\S]*?)<\/th>/g;
      const headers = [];
      let headerMatch;
      
      while ((headerMatch = headerPattern.exec(content)) !== null) {
        headers.push(headerMatch[1].trim());
      }
      
      // If headers include our expected terms
      if (headers.some(h => h.includes('PRE-EMPLOYMENT') || h.includes('PRE EMPLOYMENT')) &&
          headers.some(h => h.includes('PERIODICAL')) &&
          headers.some(h => h.includes('EXIT'))) {
        
        // Check which cell has a checkbox
        for (let i = 0; i < cells.length && i < headers.length; i++) {
          if (cells[i].includes('[x]') || cells[i].includes('✓')) {
            const header = headers[i];
            
            if (header.includes('PRE-EMPLOYMENT') || header.includes('PRE EMPLOYMENT')) {
              return 'pre-employment';
            } else if (header.includes('PERIODICAL')) {
              return 'periodical';
            } else if (header.includes('EXIT')) {
              return 'exit';
            }
          }
        }
      }
    }
  }
  
  // Fall back to the previous approach
  if (hasCheckedItem(content, ['PRE-EMPLOYMENT', 'PRE EMPLOYMENT'])) {
    return 'pre-employment';
  } else if (hasCheckedItem(content, ['PERIODICAL'])) {
    return 'periodical';
  } else if (hasCheckedItem(content, ['EXIT'])) {
    return 'exit';
  }
  
  // Check for descriptive text as a last resort
  if (content.includes('PRE-EMPLOYMENT') || content.includes('PRE EMPLOYMENT')) {
    if (content.includes('is selected') || 
        content.includes('is checked') || 
        content.includes('is marked') || 
        content.includes('checkbox is filled')) {
      return 'pre-employment';
    }
  } else if (content.includes('PERIODICAL')) {
    if (content.includes('is selected') || 
        content.includes('is checked') || 
        content.includes('is marked') || 
        content.includes('checkbox is filled')) {
      return 'periodical';
    }
  } else if (content.includes('EXIT')) {
    if (content.includes('is selected') || 
        content.includes('is checked') || 
        content.includes('is marked') || 
        content.includes('checkbox is filled')) {
      return 'exit';
    }
  }
  
  return null;
}

/**
 * Check if content has a checked item from a list of possible terms
 * @param {string} content - The content to check
 * @param {Array} terms - The terms to look for
 * @returns {boolean} True if a checked item is found
 */
function hasCheckedItem(content, terms) {
  for (const term of terms) {
    // First check if the term exists at all
    if (!content.includes(term)) continue;
    
    // Check for explicit checkbox markings near the term
    if ((content.includes('[x]') && isNearbyInText(content, term, '[x]', 150)) || 
        (content.includes('✓') && isNearbyInText(content, term, '✓', 150))) {
      return true;
    }
    
    // Check for descriptive text indicating an item is checked
    const termIndex = content.indexOf(term);
    if (termIndex !== -1) {
      const nearbyText = content.substring(Math.max(0, termIndex - 150), 
                                         Math.min(content.length, termIndex + term.length + 150));
      
      if (nearbyText.includes('is selected') ||
          nearbyText.includes('is checked') ||
          nearbyText.includes('is marked') ||
          nearbyText.includes('indicating it is selected') ||
          nearbyText.includes('option is marked')) {
        return true;
      }
    }
    
    // Check if the term is explicitly mentioned in a row that contains a checkbox
    if (content.includes('<tr>')) {
      const rowPattern = /<tr>[\s\S]*?<\/tr>/g;
      let rowMatch;
      
      while ((rowMatch = rowPattern.exec(content)) !== null) {
        const rowContent = rowMatch[0];
        
        if (rowContent.includes(term) && 
            (rowContent.includes('[x]') || rowContent.includes('✓'))) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Process medical tests from tables and forms
 * @param {Array} tables - The tables
 * @param {Object} certificateData - The certificate data to update
 */
function processMedicalTestsFromTables(tables, certificateData) {
  // Define test mapping for normalizing test names
  const testMapping = {
    'BLOODS': 'blood',
    'Bloods': 'blood',
    'Blood Test': 'blood',
    'FAR, NEAR VISION': 'vision',
    'Far, Near Vision': 'vision',
    'SIDE & DEPTH': 'depthVision',
    'Side & Depth': 'depthVision',
    'NIGHT VISION': 'nightVision',
    'Night Vision': 'nightVision',
    'Hearing': 'hearing',
    'HEARING': 'hearing',
    'Working at Heights': 'heights',
    'HEIGHTS': 'heights',
    'Lung Function': 'lung',
    'LUNG FUNCTION': 'lung',
    'X-Ray': 'xray',
    'X Ray': 'xray',
    'X-RAY': 'xray',
    'Drug Screen': 'drugScreen',
    'DRUG SCREEN': 'drugScreen'
  };

  // Initialize medical exams and results
  if (!certificateData.medicalExams) certificateData.medicalExams = {};
  if (!certificateData.medicalResults) certificateData.medicalResults = {};

  // First try tables specifically identified as medical tests
  const medicalTestTables = tables.filter(table => table.type === 'medicalTests');

  if (medicalTestTables.length > 0) {
    for (const table of medicalTestTables) {
      extractMedicalTestsFromTable(table, testMapping, certificateData);
    }
  }

  // If we didn't find many tests, try checking all tables
  if (Object.keys(certificateData.medicalExams).length < 4) {
    for (const table of tables) {
      if (table.type !== 'medicalTests') {
        // Check if this table might contain medical tests
        const tableText = JSON.stringify(table);
        if (Object.keys(testMapping).some(test => tableText.includes(test))) {
          extractMedicalTestsFromTable(table, testMapping, certificateData);
        }
      }
    }
  }

  // If we still don't have enough tests, check markdown list format directly
  if (Object.keys(certificateData.medicalExams).length < 4) {
    console.log('Looking for medical tests in markdown list format');

    // For each test, check if it's mentioned in a list format
    for (const [testName, fieldName] of Object.entries(testMapping)) {
      // Skip if we already have this test
      if (certificateData.medicalExams[fieldName] !== undefined) continue;

      // Create a pattern to match list items with the test name, done status and result
      const listPattern = new RegExp(`- \\*\\*${testName}\\*\\*\\s*(?:[\\s\\S]*?Done:\\s*\\[([x ])\\])?(?:[\\s\\S]*?Results?:\\s*([^\\n]*))?`, 'i');
      const allTables = tables.map(t => JSON.stringify(t)).join('\n');

      const match = listPattern.exec(allTables);
      if (match) {
        const isDone = match[1] === 'x';
        const result = match[2] ? match[2].trim() : '';

        certificateData.medicalExams[fieldName] = isDone;
        if (result && result !== 'N/A') {
          certificateData.medicalResults[fieldName] = result;
        }

        console.log(`Found ${testName} in list format: Done=${isDone}, Result=${result || 'N/A'}`);
      }
    }
  }
}

/**
 * Extract medical tests from a table
 * @param {Object} table - The table to extract from
 * @param {Object} testMapping - The test name mapping
 * @param {Object} certificateData - The certificate data to update
 */
function extractMedicalTestsFromTable(table, testMapping, certificateData) {
  // If we have the original HTML, use it for more reliable checkbox detection
  if (table.originalHtml) {
    const originalHtml = table.originalHtml;

    // Process each test type directly from the HTML
    for (const [testName, fieldName] of Object.entries(testMapping)) {
      if (originalHtml.includes(testName)) {
        // Find the row containing this test
        const testRowPattern = new RegExp(`<tr>[\\s\\S]*?${testName}[\\s\\S]*?<\/tr>`, 'i');
        const testRowMatch = originalHtml.match(testRowPattern);

        if (testRowMatch) {
          const testRow = testRowMatch[0];

          // Extract all cells from this row
          const cellPattern = /<td>([\s\S]*?)<\/td>/g;
          const cells = [];
          let cellMatch;

          while ((cellMatch = cellPattern.exec(testRow)) !== null) {
            cells.push(cellMatch[1].trim());
          }

          // First cell should be the test name, then done status, then result
          if (cells.length >= 2) {
            // For done status, check if the second cell has a checkbox
            const isDone = cells[1].includes('[x]') ||
                          cells[1].includes('✓') ||
                          cells[1].includes('X') ||
                          cells[1] === 'Yes' ||
                          cells[1] === 'Done';

            certificateData.medicalExams[fieldName] = isDone;

            // If we have a result (third cell) and it's not N/A
            if (cells.length >= 3 && cells[2] && cells[2].trim() !== '' && cells[2].trim() !== 'N/A') {
              certificateData.medicalResults[fieldName] = cells[2].trim();
            }

            console.log(`Found medical test from HTML: ${testName} -> ${fieldName}, Done: ${isDone}, Result: ${certificateData.medicalResults[fieldName] || 'N/A'}`);
          }
        }
      }
    }

    // Return early if we processed any tests from HTML
    if (Object.keys(certificateData.medicalExams).length > 0) {
      return;
    }
  }

  // Continue with the regular extraction if HTML didn't yield results
  // Determine the column indices for test name, done status, and results
  const headers = table.headers.map(h => h.toLowerCase());

  let testColumn = -1;
  let doneColumn = -1;
  let resultColumn = -1;

  // Try to find columns by header names
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase();
    if (header.includes('test')) testColumn = i;
    if (header.includes('done')) doneColumn = i;
    if (header.includes('result')) resultColumn = i;
  }

  // If columns weren't found by name, make some assumptions
  if (testColumn === -1) testColumn = 0;
  if (doneColumn === -1 && resultColumn !== -1) doneColumn = resultColumn - 1;
  if (doneColumn === -1) doneColumn = 1;
  if (resultColumn === -1 && doneColumn !== -1) resultColumn = doneColumn + 1;
  if (resultColumn === -1) resultColumn = 2;

  console.log(`Table headers: ${table.headers.join(', ')}`);
  console.log(`Determined columns: Test=${testColumn}, Done=${doneColumn}, Result=${resultColumn}`);

  // Process each row
  for (const row of table.rows) {
    if (row.length <= Math.max(testColumn, doneColumn, resultColumn)) {
      console.log(`Skipping short row: ${row.join(', ')}`);
      continue;
    }

    const testName = row[testColumn].trim();

    // Skip header-like rows
    if (testName.toLowerCase() === 'test') {
      console.log('Skipping header row');
      continue;
    }

    // Get the normalized field name
    let fieldName = testMapping[testName];

    if (!fieldName) {
      // Try to find a match in the test mapping
      const matchingKey = Object.keys(testMapping).find(key =>
        testName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(testName.toLowerCase()));

      if (matchingKey) {
        fieldName = testMapping[matchingKey];
      } else {
        // If no match, use a normalized version of the name
        fieldName = testName.toLowerCase().replace(/\s+/g, '_');
      }
    }

    // Determine if test was done - make sure the column exists
    let isDone = false;
    if (doneColumn < row.length) {
      const doneStatus = row[doneColumn].trim();
      isDone = doneStatus.includes('[x]') ||
              doneStatus.includes('✓') ||
              doneStatus.includes('X') ||
              doneStatus === 'Yes' ||
              doneStatus === 'Done';
    }

    // Get the result if available - make sure the column exists
    let result = '';
    if (resultColumn < row.length && row[resultColumn]) {
      result = row[resultColumn].trim();
      if (result === 'N/A' || result === '-') result = '';
    }

    // Store the data if we have a valid field name
    if (fieldName) {
      certificateData.medicalExams[fieldName] = isDone;
      if (result) {
        certificateData.medicalResults[fieldName] = result;
      }

      console.log(`Found medical test: ${testName} -> ${fieldName}, Done: ${isDone}, Result: ${result || 'N/A'}`);
    } else {
      console.log(`Could not determine field name for test: ${testName}`);
    }
  }
}

/**
 * Process fitness declaration from forms and tables
 * @param {Array} forms - The forms
 * @param {Array} tables - The tables
 * @param {Object} certificateData - The certificate data to update
 */
function processFitnessDeclarationFromContent(forms, tables, certificateData) {
  // First try fitness declaration forms
  const fitnessForms = forms.filter(form => form.type === 'fitnessDeclaration');
  
  // Check forms
  let fitnessDeclaration = null;
  for (const form of fitnessForms) {
    fitnessDeclaration = determineOverallFitness(form.content);
    if (fitnessDeclaration) {
      certificateData.fitnessDeclaration = fitnessDeclaration;
      console.log(`Found fitness declaration from form: ${fitnessDeclaration}`);
      break;
    }
  }
  
  // If not found in specific forms, check fitness tables
  if (!fitnessDeclaration) {
    const fitnessTables = tables.filter(table => table.type === 'fitnessDeclaration');
    
    for (const table of fitnessTables) {
      fitnessDeclaration = extractFitnessFromTable(table);
      if (fitnessDeclaration) {
        certificateData.fitnessDeclaration = fitnessDeclaration;
        console.log(`Found fitness declaration from table: ${fitnessDeclaration}`);
        break;
      }
    }
  }
  
  // If still not found, check all forms
  if (!fitnessDeclaration) {
    for (const form of forms) {
      fitnessDeclaration = determineOverallFitness(form.content);
      if (fitnessDeclaration) {
        certificateData.fitnessDeclaration = fitnessDeclaration;
        console.log(`Found fitness declaration from any form: ${fitnessDeclaration}`);
        break;
      }
    }
  }
}

/**
 * Determine overall fitness from content
 * @param {string} content - The content to analyze
 * @returns {string|null} The fitness declaration or null if not found
 */
function determineOverallFitness(content) {
  // First check for explicit descriptions of fitness status
  if (content.includes('FIT') && content.includes('crossed out') || 
      content.includes('FIT') && content.includes('X that spans') || 
      content.includes('FIT') && content.includes('negated')) {
    return 'unfit';
  }
  
  // Check for table rows that contain fitness options
  if (content.includes('<tr>')) {
    const rowPattern = /<tr>[\s\S]*?<\/tr>/g;
    let rowMatch;
    
    while ((rowMatch = rowPattern.exec(content)) !== null) {
      const rowContent = rowMatch[0];
      
      // Check for FIT
      if (rowContent.includes('FIT') && !rowContent.includes('UNFIT') && 
          !rowContent.includes('with Restriction') && !rowContent.includes('with Condition')) {
        if (rowContent.includes('[x]') || rowContent.includes('✓')) {
          return 'fit';
        }
      }
      
      // Check for Fit with Restriction
      if (rowContent.includes('Fit with Restriction') || rowContent.includes('FIT WITH RESTRICTION')) {
        if (rowContent.includes('[x]') || rowContent.includes('✓')) {
          return 'fitWithRestriction';
        }
      }
      
      // Check for Fit with Condition
      if (rowContent.includes('Fit with Condition') || rowContent.includes('FIT WITH CONDITION')) {
        if (rowContent.includes('[x]') || rowContent.includes('✓')) {
          return 'fitWithCondition';
        }
      }
      
      // Check for Temporary Unfit
      if (rowContent.includes('Temporary Unfit') || rowContent.includes('TEMPORARY UNFIT')) {
        if (rowContent.includes('[x]') || rowContent.includes('✓')) {
          return 'temporaryUnfit';
        }
      }
      
      // Check for UNFIT
      if (rowContent.includes('UNFIT') || rowContent.includes('Unfit for Work')) {
        if (rowContent.includes('[x]') || rowContent.includes('✓')) {
          return 'unfit';
        }
      }
    }
  }
  
  // Check for direct descriptions
  if (content.includes('FIT') && content.includes('is marked with an `[x]`') ||
      content.includes('FIT option is marked') ||
      content.includes('This option is marked: FIT')) {
    return 'fit';
  }
  
  if (content.includes('Fit with Restriction') && content.includes('is marked with an `[x]`') ||
      content.includes('Fit with Restriction option is marked') ||
      content.includes('This option is marked: Fit with Restriction')) {
    return 'fitWithRestriction';
  }
  
  if (content.includes('Fit with Condition') && content.includes('is marked with an `[x]`') ||
      content.includes('Fit with Condition option is marked') ||
      content.includes('This option is marked: Fit with Condition')) {
    return 'fitWithCondition';
  }
  
  if (content.includes('Temporary Unfit') && content.includes('is marked with an `[x]`') ||
      content.includes('Temporary Unfit option is marked') ||
      content.includes('This option is marked: Temporary Unfit')) {
    return 'temporaryUnfit';
  }
  
  if (content.includes('UNFIT') && content.includes('is marked with an `[x]`') ||
      content.includes('UNFIT option is marked') ||
      content.includes('This option is marked: UNFIT')) {
    return 'unfit';
  }
  
  // Fall back to the previous approach
  if (hasCheckedItem(content, ['FIT', 'Fit for Work'])) {
    return 'fit';
  } else if (hasCheckedItem(content, ['Fit with Restriction', 'FIT WITH RESTRICTION'])) {
    return 'fitWithRestriction';
  } else if (hasCheckedItem(content, ['Fit with Condition', 'FIT WITH CONDITION'])) {
    return 'fitWithCondition';
  } else if (hasCheckedItem(content, ['Temporary Unfit', 'TEMPORARY UNFIT'])) {
    return 'temporaryUnfit';
  } else if (hasCheckedItem(content, ['UNFIT', 'Unfit for Work'])) {
    return 'unfit';
  }
  
  return null;
}

/**
 * Extract fitness declaration from table
 * @param {Object} table - The table to extract from
 * @returns {string|null} The fitness declaration or null if not found
 */
function extractFitnessFromTable(table) {
  // Convert table to text for analysis
  const tableText = table.headers.join(' ') + ' ' + 
                   table.rows.map(row => row.join(' ')).join(' ');
  
  return determineOverallFitness(tableText);
}

/**
 * Process restrictions from forms and tables
 * @param {Array} forms - The forms
 * @param {Array} tables - The tables
 * @param {Object} certificateData - The certificate data to update
 */
function processRestrictionsFromContent(forms, tables, certificateData) {
  // Define restriction mapping for normalizing restriction names
  const restrictionMapping = {
    'Heights': 'heights',
    'Working at Heights': 'heights',
    'Dust Exposure': 'dust',
    'Motorized Equipment': 'motorized',
    'Wear Hearing Protection': 'hearingProtection',
    'Confined Spaces': 'confinedSpaces',
    'Chemical Exposure': 'chemical',
    'Wear Spectacles': 'spectacles',
    'Remain on Treatment': 'treatment',
    'Remain on Treatment for Chronic Conditions': 'chronicConditions'
  };

  // Initialize restrictions object
  if (!certificateData.restrictions) certificateData.restrictions = {};

  // Check for text indicating no restrictions are applied
  const allFormsContent = forms.map(form => form.content).join(' ');
  if (allFormsContent.includes('nothing was ticked') ||
      allFormsContent.includes('no ticks') ||
      allFormsContent.includes('none are applied')) {

    // Set all restrictions to false
    Object.values(restrictionMapping).forEach(fieldName => {
      certificateData.restrictions[fieldName] = false;
    });
    console.log('Found explicit indication that no restrictions are applied');
    return;
  }

  // First try to find a restrictions section or form with explicit checkmarks
  for (const form of forms) {
    // Only focus on restriction forms
    if (form.type === 'restrictions') {
      const content = form.content;

      // Look for list pattern within restrictions section
      const restrictionLines = content.split('\n');

      for (const line of restrictionLines) {
        // For each restriction, check if it's mentioned and has a checkbox
        for (const [restrictionName, fieldName] of Object.entries(restrictionMapping)) {
          if (line.includes(restrictionName)) {
            const isMarked = line.includes('[x]') || line.includes('✓');
            certificateData.restrictions[fieldName] = isMarked;
            console.log(`Found restriction in list format: ${restrictionName} -> ${fieldName}, Applied: ${isMarked}`);
          }
        }
      }

      // Check if there's a markdown or HTML table in the restriction content
      if (content.includes('|') || content.includes('<table>')) {
        // Check each restriction to see if it's in a table cell with a checkbox
        for (const [restrictionName, fieldName] of Object.entries(restrictionMapping)) {
          if (content.includes(restrictionName)) {
            // First try to find an explicit [x] in the same line
            const restrictionLineMatch = content.match(new RegExp(`.*(${restrictionName}).*?\\[(x| )\\].*`, 'i'));

            if (restrictionLineMatch) {
              const isMarked = restrictionLineMatch[0].includes('[x]');
              certificateData.restrictions[fieldName] = isMarked;
              console.log(`Found restriction with checkbox: ${restrictionName} -> ${fieldName}, Applied: ${isMarked}`);
            } else {
              // If no checkbox found, default to true if it's mentioned in a restrictions list
              // This handles the case where restrictions are listed but without checkboxes
              certificateData.restrictions[fieldName] = true;
              console.log(`Found restriction mentioned: ${restrictionName} -> ${fieldName}, Applied: true`);
            }
          }
        }
      }
    }
  }

  // Check tables specifically tagged as restriction tables
  const restrictionTables = tables.filter(table => table.type === 'restrictions');

  if (restrictionTables.length > 0) {
    for (const table of restrictionTables) {
      // Convert all cells to a single string for searching
      const allCells = table.headers.join(' ') + ' ' +
                      table.rows.map(row => row.join(' ')).join(' ');

      // For each restriction, check if it's in the table cells
      for (const [restrictionName, fieldName] of Object.entries(restrictionMapping)) {
        if (allCells.includes(restrictionName)) {
          // Check if there's a checkbox in the same table
          const isMarked = (allCells.includes('[x]') &&
                           isNearbyInText(allCells, restrictionName, '[x]', 200)) ||
                          (allCells.includes('✓') &&
                           isNearbyInText(allCells, restrictionName, '✓', 200));

          // Set the restriction value (defaulting to true if mentioned in a restrictions table)
          certificateData.restrictions[fieldName] = isMarked;
          console.log(`Found restriction in table: ${restrictionName} -> ${fieldName}, Applied: ${isMarked}`);
        }
      }
    }
  }

  // If we couldn't determine any restrictions from specific sections,
  // check the entire markdown for mention of restrictions
  if (Object.keys(certificateData.restrictions).length === 0) {
    // Check the entire markdown
    const fullMarkdown = forms.map(form => form.content).join('\n') +
                        tables.map(table => JSON.stringify(table)).join('\n');

    // For each restriction, check if it's mentioned anywhere
    for (const [restrictionName, fieldName] of Object.entries(restrictionMapping)) {
      if (fullMarkdown.includes(restrictionName)) {
        // Find the context around the restriction mention
        const contextPattern = new RegExp(`[\\s\\S]{0,100}${restrictionName}[\\s\\S]{0,100}`, 'i');
        const contextMatch = fullMarkdown.match(contextPattern);

        if (contextMatch) {
          const context = contextMatch[0];
          // Check if there's a checkbox or indicator of application
          const isMarked = (context.includes('[x]') &&
                           isNearbyInText(context, restrictionName, '[x]', 100)) ||
                          (context.includes('✓') &&
                           isNearbyInText(context, restrictionName, '✓', 100)) ||
                          (context.includes('applied') &&
                           isNearbyInText(context, restrictionName, 'applied', 100));

          certificateData.restrictions[fieldName] = isMarked;
          console.log(`Found restriction in general content: ${restrictionName} -> ${fieldName}, Applied: ${isMarked}`);
        }
      }
    }
  }

  // Set default value of false for any restriction that wasn't found
  Object.values(restrictionMapping).forEach(fieldName => {
    if (certificateData.restrictions[fieldName] === undefined) {
      certificateData.restrictions[fieldName] = false;
    }
  });
}

/**
 * Extract restrictions from content
 * @param {string} content - The content to analyze
 * @param {Object} restrictionMapping - The restriction name mapping
 * @param {Object} certificateData - The certificate data to update
 */
function extractRestrictionsFromContent(content, restrictionMapping, certificateData) {
  // For each restriction type, check if it exists and is marked
  for (const [restrictionName, fieldName] of Object.entries(restrictionMapping)) {
    // Only process if we haven't already determined this restriction
    if (certificateData.restrictions[fieldName] !== undefined) continue;
    
    if (content.includes(restrictionName)) {
      // Check if there are checkmarks or other indicators nearby
      const isMarked = hasCheckedItem(content, [restrictionName]);
      
      // Store the restriction status
      certificateData.restrictions[fieldName] = isMarked;
      console.log(`Found restriction: ${restrictionName} -> ${fieldName}, Applied: ${isMarked}`);
    }
  }
}

/**
 * Process referral and review dates from key-values
 * @param {Array} keyValues - The key-value pairs
 * @param {Object} certificateData - The certificate data to update
 */
function processReferralAndReview(keyValues, certificateData) {
  // Process referral
  const referralKeys = ['Referred or follow up actions', 'Referral', 'Follow Up'];
  for (const key of referralKeys) {
    const match = keyValues.find(kv => kv.key.toLowerCase() === key.toLowerCase());

    if (match && match.value && match.value.trim() !== '') {
      // Validate that this isn't a section header (which might start with ##)
      if (!match.value.trim().startsWith('##')) {
        certificateData.referral = match.value.trim();
        console.log(`Found referral: ${certificateData.referral}`);
        break;
      }
    }
  }

  // Process review date
  const reviewKeys = ['Review Date', 'Next Review', 'Follow Up Date'];
  for (const key of reviewKeys) {
    const match = keyValues.find(kv => kv.key.toLowerCase() === key.toLowerCase());

    if (match && match.value && match.value.trim() !== '') {
      // Validate that this isn't a section header (which might start with ##)
      if (!match.value.trim().startsWith('##')) {
        certificateData.review_date = match.value.trim();
        console.log(`Found review date: ${certificateData.review_date}`);
        break;
      }
    }
  }

  // If we didn't find the review date, check for a date after "Review Date:"
  if (!certificateData.review_date) {
    // Check the full content of all key-values
    const allKeyValues = keyValues.map(kv => `${kv.key}: ${kv.value}`).join('\n');

    // Look for patterns like "Review Date: 15.09.2023"
    const datePattern = /Review Date:?\s*(\d{1,2}[-\.\/]\d{1,2}[-\.\/]\d{2,4})/i;
    const dateMatch = allKeyValues.match(datePattern);

    if (dateMatch && dateMatch[1]) {
      certificateData.review_date = dateMatch[1].trim();
      console.log(`Found review date from pattern: ${certificateData.review_date}`);
    }
  }
}

/**
 * Process comments from key-values
 * @param {Array} keyValues - The key-value pairs
 * @param {Object} certificateData - The certificate data to update
 */
function processComments(keyValues, certificateData) {
  const commentKeys = ['Comments', 'Additional Notes', 'Remarks'];
  for (const key of commentKeys) {
    const match = keyValues.find(kv => kv.key.toLowerCase() === key.toLowerCase());
    
    if (match && match.value && match.value.trim() !== '') {
      certificateData.comments = match.value.trim();
      console.log(`Found comments: ${certificateData.comments}`);
      break;
    }
  }
}

/**
 * Process any remaining fields from the full markdown
 * @param {string} markdown - The markdown content
 * @param {Object} certificateData - The certificate data to update
 */
function processRemainingFieldsFromFullMarkdown(markdown, certificateData) {
  // Check for missing fields
  const requiredFields = ['name', 'id_number', 'company', 'exam_date', 'expiry_date', 'job'];
  const missingFields = requiredFields.filter(field => !certificateData[field]);
  
  if (missingFields.length > 0) {
    console.log(`Trying to find missing fields from full text: ${missingFields.join(', ')}`);
    
    // Process each missing field with direct text search
    for (const field of missingFields) {
      const value = extractValueByKey(markdown, getKeyOptionsForField(field));
      
      if (value) {
        certificateData[field] = value;
        console.log(`Found ${field} from direct text search: ${value}`);
      }
    }
  }
  
  // Check for medical tests if we don't have enough
  if (Object.keys(certificateData.medicalExams).length < 4) {
    console.log('Trying to find medical tests from full text');
    extractMedicalTestsFromText(markdown, certificateData);
  }
  
  // Check for fitness declaration if missing
  if (!certificateData.fitnessDeclaration) {
    console.log('Trying to find fitness declaration from full text');
    extractFitnessDeclarationFromText(markdown, certificateData);
  }
}

/**
 * Get key options for a field
 * @param {string} field - The field name
 * @returns {Array} Array of possible keys for the field
 */
function getKeyOptionsForField(field) {
  switch(field) {
    case 'name': 
      return ['Initials & Surname', 'Name', 'Employee', 'Full Name', 'Patient Name'];
    case 'id_number': 
      return ['ID NO', 'ID Number', 'Identity Number', 'ID', 'National ID'];
    case 'company': 
      return ['Company Name', 'Company', 'Employer', 'Organization'];
    case 'exam_date': 
      return ['Date of Examination', 'Exam Date', 'Examination Date', 'Date of Medical', 'Assessment Date'];
    case 'expiry_date': 
      return ['Expiry Date', 'Valid Until', 'Expires On', 'Expiration Date', 'Valid To'];
    case 'job': 
      return ['Job Title', 'Position', 'Occupation', 'Designation', 'Role'];
    default:
      return [];
  }
}

/**
 * Extract a value by looking for any of the given keys
 * @param {string} text - The text to search in
 * @param {Array} keys - The possible keys to look for
 * @returns {string|null} The extracted value or null if not found
 */
function extractValueByKey(text, keys) {
  for (const key of keys) {
    // Try different patterns
    const patterns = [
      new RegExp(`\\*\\*${key}\\*\\*:\\s*([^\\n]+)`, 'i'),
      new RegExp(`${key}:\\s*([^\\n]+)`, 'i'),
      new RegExp(`${key}\\s+([^\\n]+)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        return match[1].trim();
      }
    }
  }
  
  return null;
}

/**
 * Extract medical tests from text
 * @param {string} text - The text to extract from
 * @param {Object} certificateData - The certificate data to update
 */
function extractMedicalTestsFromText(text, certificateData) {
  // Define test mapping
  const testMapping = {
    'BLOODS': 'blood',
    'Bloods': 'blood',
    'Blood Test': 'blood',
    'FAR, NEAR VISION': 'vision',
    'Far, Near Vision': 'vision',
    'SIDE & DEPTH': 'depthVision',
    'Side & Depth': 'depthVision',
    'NIGHT VISION': 'nightVision',
    'Night Vision': 'nightVision',
    'Hearing': 'hearing',
    'HEARING': 'hearing',
    'Working at Heights': 'heights',
    'HEIGHTS': 'heights',
    'Lung Function': 'lung',
    'LUNG FUNCTION': 'lung',
    'X-Ray': 'xray',
    'X Ray': 'xray',
    'X-RAY': 'xray',
    'Drug Screen': 'drugScreen',
    'DRUG SCREEN': 'drugScreen'
  };
  
  // Initialize objects if needed
  if (!certificateData.medicalExams) certificateData.medicalExams = {};
  if (!certificateData.medicalResults) certificateData.medicalResults = {};
  
  // Look for each test in the text
  for (const [testName, fieldName] of Object.entries(testMapping)) {
    // Skip if we already have this test
    if (certificateData.medicalExams[fieldName] !== undefined) continue;
    
    if (text.includes(testName)) {
      // Find the nearby content (next 300 characters after the test name)
      const testIndex = text.indexOf(testName);
      const nearbyText = text.substring(testIndex, testIndex + 300);
      
      // Check if there's a "Done" or checkmark indicator nearby
      const isDone = nearbyText.includes('[x]') ||
                    nearbyText.includes('✓') ||
                    (nearbyText.includes('Done') && (
                      nearbyText.includes('Done: [x]') ||
                      nearbyText.includes('Done: ✓') ||
                      nearbyText.includes('Done: Yes')
                    ));
      
      // Try to extract result
      let result = '';
      const resultMatch = nearbyText.match(/Results?:?\s*([^,\n\]]*)/i);
      if (resultMatch && resultMatch[1] && resultMatch[1].trim() !== 'N/A') {
        result = resultMatch[1].trim();
      }
      
      // Store the data
      certificateData.medicalExams[fieldName] = isDone;
      if (result) {
        certificateData.medicalResults[fieldName] = result;
      }
      
      console.log(`Found medical test via text search: ${testName} -> ${fieldName}, Done: ${isDone}, Result: ${result || 'N/A'}`);
    }
  }
}

/**
 * Extract fitness declaration from text
 * @param {string} text - The text to extract from
 * @param {Object} certificateData - The certificate data to update
 */
function extractFitnessDeclarationFromText(text, certificateData) {
  // Define fitness options
  const fitnessOptions = [
    { term: 'FIT', value: 'fit' },
    { term: 'Fit with Restriction', value: 'fitWithRestriction' },
    { term: 'Fit with Condition', value: 'fitWithCondition' },
    { term: 'Temporary Unfit', value: 'temporaryUnfit' },
    { term: 'UNFIT', value: 'unfit' }
  ];
  
  // Check each option
  for (const option of fitnessOptions) {
    if (text.includes(option.term) && hasCheckedItem(text, [option.term])) {
      certificateData.fitnessDeclaration = option.value;
      console.log(`Found fitness declaration via text search: ${option.value}`);
      break;
    }
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
 * Clean and normalize the extracted data
 * @param {Object} certificateData - The certificate data to clean
 * @returns {Object} Cleaned certificate data
 */
function normalizeExtractionResults(certificateData) {
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

// Export as ES modules for compatibility with the project
export {
  extractStructuredDataFromMarkdown,
  extractAllTables,
  extractAllKeyValues,
  extractAllForms,
  extractAllFigures,
  extractValueByKey,
  determineExaminationType,
  extractMedicalTestsFromTable,
  determineOverallFitness,
  isNearbyInText
};