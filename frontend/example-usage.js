/**
 * Example usage of certificateExtractor.js and CertificateTemplate.jsx
 * This file demonstrates how to extract data from an API response and populate the template
 */

import React from 'react';
import { extractCertificateData, mapToCertificateFields } from './src/utils/certificateExtractor';
import CertificateTemplate from './src/components/templates/CertificateTemplate';

// Example API response with OCR data
const exampleApiResponse = {
  status: 'success',
  markdown: `
# Medical Certificate

## Document Details
**Document Type**: Certificate of Fitness
**Document Identifier**: MED-20250514-001

## Patient Information
**Patient Name**: Emily Johnson
**ID Number**: 9505236584930
**Gender**: Female
**Date of Birth**: 1995-05-23
**Company**: TechHealth Inc
**Job Title**: Software Engineer

## Examination Details
**Date of Examination**: 2025-04-12
**Expiry Date**: 2026-04-12
**Examination Type**: [x] Periodical

## Medical Examination Tests
| Test | Done | Results |
| --- | --- | --- |
| BLOODS | [x] | Normal |
| FAR, NEAR VISION | [x] | 20/20 |
| SIDE & DEPTH | [x] | Normal |
| NIGHT VISION | [ ] | N/A |
| Hearing | [x] | Normal |
| Working at Heights | [x] | Pass |
| Lung Function | [x] | Normal |
| X-Ray | [ ] | N/A |
| Drug Screen | [x] | Negative |

## Restrictions
- [ ] Heights
- [ ] Dust Exposure
- [ ] Motorized Equipment
- [x] Wear Hearing Protection
- [ ] Confined Spaces
- [ ] Chemical Exposure
- [x] Wear Spectacles
- [ ] Remain on Treatment for Chronic Conditions

## Medical Fitness Declaration
[x] FIT
[ ] Fit with Restriction
[ ] Fit with Condition
[ ] Temporary Unfit
[ ] UNFIT

## Additional Information
**Referred or Follow Up Actions**: N/A
**Review Date**: 2025-10-12
**Comments**: Patient is fit for all duties with specified protective equipment.
  `,
  evidence: {
    "certificate.pdf:1": [
      {
        "captions": [
          "Medical Certificate",
          "Certificate of Fitness",
          "Patient Name: Emily Johnson",
          "ID Number: 9505236584930",
          "Date of Examination: 2025-04-12",
          "Expiry Date: 2026-04-12"
        ]
      }
    ]
  }
};

// Example function that demonstrates the extraction and population process
function demonstrateCertificatePopulation() {
  // Step 1: Extract structured data from the API response
  const extractedData = extractCertificateData(exampleApiResponse, "Certificate of Fitness");
  console.log("Extracted Certificate Data:", extractedData);
  
  // Step 2: Map to template fields if necessary (for backward compatibility)
  // This step is optional if the data is already in the right format
  const templateData = mapToCertificateFields(extractedData);
  console.log("Data mapped for template:", templateData);
  
  // Step 3: Use the extracted data to populate the CertificateTemplate component
  return (
    <div>
      <h1>Certificate Preview</h1>
      <div className="certificate-container">
        <CertificateTemplate data={templateData} />
      </div>
    </div>
  );
}

// Example of handling an API response in a React component
function MedicalCertificateView({ apiResponse }) {
  // If we don't have a response yet, show a loading state
  if (!apiResponse) {
    return <div>Loading certificate data...</div>;
  }
  
  // Extract certificate data and populate the template
  const certificateData = extractCertificateData(apiResponse);
  
  return (
    <div className="certificate-view">
      <CertificateTemplate data={certificateData} />
      <div className="certificate-actions">
        <button className="print-button">Print Certificate</button>
        <button className="download-button">Download PDF</button>
      </div>
    </div>
  );
}

// Example of using the extractAndPopulateTemplateData function from documents.js
function extractAndPopulateMedicalCertificate(currentFile, processedData) {
  console.log('Processing data for extraction:', processedData);
  
  // Get the type of document to ensure correct template mapping
  const docType = 'Certificate of Fitness'; // This could be determined based on file patterns
  
  try {
    // Extract structured data from OCR output
    const certificateData = extractCertificateData(processedData, docType);
    console.log('Extracted certificate data:', certificateData);
    
    // Use the extracted data to populate your template
    return certificateData;
  } catch (error) {
    console.error('Error processing document data:', error);
    
    // Return a default template with error information
    return {
      name: 'Error in processing',
      id_number: '',
      company: '',
      exam_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      job: '',
      comments: `Error extracting data: ${error.message}`
    };
  }
}

export {
  demonstrateCertificatePopulation,
  MedicalCertificateView,
  extractAndPopulateMedicalCertificate
};