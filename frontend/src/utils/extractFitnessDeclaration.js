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

// Export the function as ES modules
export default extractFitnessDeclaration;
export { extractFitnessDeclaration };