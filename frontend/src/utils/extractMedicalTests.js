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

// Helper function for checking proximity
function isNearbyInText(text, str1, str2, maxDistance) {
  const index1 = text.indexOf(str1);
  const index2 = text.indexOf(str2);
  
  if (index1 === -1 || index2 === -1) return false;
  
  return Math.abs(index1 - index2) <= maxDistance;
}

// Export the function as ES modules
export default extractMedicalTests;
export { extractMedicalTests };