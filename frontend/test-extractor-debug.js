// Simple debug script for certificate extractor

import * as structuredDataExtractor from './src/utils/structuredDataExtractor.js';

// Sample text with examination type and medical tests
const debugMarkdown = `
## Document Details

- **Initials & Surname**: T.A. Nkosi
- **ID NO**: 900304 5496 084
- **Company Name**: Bluecollar Occ Health
- **Date of Examination**: 26.02.2025
- **Expiry Date**: 26.02.2026
- **Job Title**: Technician

## Examination Type

- **Pre-Employment**: [x]
- **Periodical**: [ ]
- **Exit**: [ ] 

### Examination Results

#### Vision Tests
- **Bloods**
  - Done: [x]
  - Results: N/A

- **Far, Near Vision**
  - Done: [x]
  - Results: 20/30

- **Side & Depth**
  - Done: [x]
  - Results: Normal

- **Night Vision**
  - Done: [x]
  - Results: 20/30

#### Other Tests
- **Hearing**
  - Done: [x]
  - Results: 3-4

- **Working at Heights**
  - Done: [ ]
  - Results: N/A

- **Lung Function**
  - Done: [x]
  - Results: 70% Restriction

- **X-Ray**
  - Done: [x]
  - Results: N/A

- **Drug Screen**
  - Done: [ ]
  - Results: N/A

## Medical Fitness Declaration

| FIT | Fit with Restriction | Fit with Condition | Temporary Unfit | UNFIT |
|-----|----------------------|--------------------|-----------------|-------|
| [x] | [ ]                  | [ ]                | [ ]             | [ ]   |
`;

async function runDebugTest() {
  try {
    console.log("Starting debug extraction test...");
    
    // Extract all forms first
    const forms = structuredDataExtractor.extractAllForms(debugMarkdown);
    console.log("Forms extracted:", forms.length);
    forms.forEach((form, i) => {
      console.log(`Form ${i+1} type: ${form.type}`);
      console.log(`Content length: ${form.content.length} characters`);
    });
    
    // Extract all tables
    const tables = structuredDataExtractor.extractAllTables(debugMarkdown);
    console.log("Tables extracted:", tables.length);
    tables.forEach((table, i) => {
      console.log(`Table ${i+1} type: ${table.type}`);
      console.log(`Headers: ${table.headers.join(', ')}`);
      console.log(`Rows: ${table.rows.length}`);
    });
    
    // Extract key-values
    const keyValues = structuredDataExtractor.extractAllKeyValues(debugMarkdown);
    console.log("Key-Values extracted:", keyValues.length);
    keyValues.forEach((kv, i) => {
      console.log(`KeyValue ${i+1}: ${kv.key} = ${kv.value}`);
    });
    
    // Try full extraction
    const result = structuredDataExtractor.extractStructuredDataFromMarkdown(debugMarkdown);
    console.log("\nFull extraction result:");
    console.log(JSON.stringify(result, null, 2));
    
    // Check specific fields
    console.log("\nSpecific fields check:");
    console.log("Name:", result.name);
    console.log("ID:", result.id_number);
    console.log("Examination Type:", result.examinationType);
    console.log("Medical Exams:", Object.keys(result.medicalExams).length);
    console.log("Medical Tests:", result.medicalExams);
    console.log("Fitness Declaration:", result.fitnessDeclaration);
    
  } catch (error) {
    console.error("Error during debug test:", error);
  }
}

// Run the test
runDebugTest();