# Certificate Extraction and Template Guide

This guide explains how to use the certificate extraction functionality with the Certificate Template component.

## Overview

The certificate extraction system works by:

1. Processing OCR data from uploaded medical certificates
2. Extracting structured data using pattern matching and natural language processing
3. Normalizing the data to work with our standardized certificate template
4. Displaying the extracted data in a consistent, professional certificate format

## How to Use the Certificate Extractor

### Basic Usage

```javascript
import { extractCertificateData } from '../utils/certificateExtractor';
import CertificateTemplate from '../components/templates/CertificateTemplate';

// Process API response data
const certificateData = extractCertificateData(apiResponse, "Certificate of Fitness");

// Display the extracted data in the template
return <CertificateTemplate data={certificateData} />;
```

### Full Example with Error Handling

```javascript
function processCertificate(apiResponse) {
  try {
    // Check if we have valid data
    if (!apiResponse || !apiResponse.markdown) {
      return {
        name: "Error: No data available",
        documentType: "Certificate of Fitness",
        error: true
      };
    }
    
    // Extract data from the API response
    const certificateData = extractCertificateData(apiResponse, "Certificate of Fitness");
    
    // Return the processed data
    return certificateData;
    
  } catch (error) {
    console.error("Error extracting certificate data:", error);
    
    // Return a minimal error state for the template
    return {
      name: "Error processing certificate",
      id_number: "",
      company: "",
      exam_date: new Date().toISOString().split('T')[0],
      error: true,
      comments: `Error: ${error.message}`
    };
  }
}
```

## Data Structure

The certificate extractor produces a standardized data structure:

```javascript
{
  // Employee details
  name: "John Smith",
  id_number: "8801015555088",
  company: "ABC Corporation",
  exam_date: "2025-04-10",
  expiry_date: "2026-04-10",
  job: "Senior Engineer",
  
  // Examination type
  examinationType: "periodical", // Can be "pre-employment", "periodical", or "exit"
  
  // Medical exams - boolean values indicating if the test was performed
  medicalExams: {
    blood: true,
    vision: true,
    depthVision: true,
    nightVision: false,
    hearing: true,
    heights: true,
    lung: true,
    xray: true,
    drugScreen: true
  },
  
  // Medical results - string values for test results
  medicalResults: {
    blood: "Normal",
    vision: "20/20",
    depthVision: "Normal",
    hearing: "Normal",
    heights: "Pass",
    lung: "Normal",
    xray: "Clear",
    drugScreen: "Negative"
  },
  
  // Restrictions - boolean values indicating if restriction applies
  restrictions: {
    heights: false,
    dust: false,
    motorized: false,
    hearingProtection: true,
    confinedSpaces: false,
    chemical: false,
    spectacles: true,
    treatment: false
  },
  
  // Fitness declaration - one of: "fit", "fitWithRestriction", "fitWithCondition", "temporaryUnfit", "unfit"
  fitnessDeclaration: "fit",
  
  // Additional information
  referral: "None required",
  review_date: "2025-09-10",
  comments: "Patient is fit for all duties."
}
```

## Handling Different Certificate Formats

The extractor is designed to handle multiple certificate formats, including:

1. Standard certificate of fitness documents
2. BLUECOLLAR occupational health certificates
3. Various medical questionnaire formats
4. Customized organizational templates

The extractor uses multiple pattern matching techniques to identify information regardless of the exact format.

### Snake Case vs. Camel Case

The extractor and template support both naming conventions:

```javascript
// Both of these formats will work:
const snakeCaseData = {
  medical_exams: { blood: true },
  medical_results: { blood: "Normal" }
};

const camelCaseData = {
  medicalExams: { blood: true },
  medicalResults: { blood: "Normal" }
};
```

## Customizing the Template

The CertificateTemplate component is designed to work with the default data structure, but it can be adapted for different formats by modifying the component directly.

See `src/components/templates/CertificateTemplate.jsx` for details on how it renders the certificate.

## Troubleshooting

### Common Issues

1. **Missing Fields**: If certain fields are missing in the template:
   - Check if the extractor is finding the data (add `console.log(certificateData)`)
   - Try different naming patterns in the source document

2. **Wrong Field Mapping**: If data appears in the wrong place:
   - Check the extracted data structure
   - Ensure the field names match what the template expects

3. **Extraction Errors**: If the extractor fails:
   - Look for special characters or unusual formatting in the source
   - Try preprocessing the markdown text to clean it up

### Debugging Tools

Use the certificate-demo.js page to test different certificate formats and see how they are processed:

```
http://localhost:3000/certificate-demo
```

This page allows you to view both the extracted data and the rendered template side by side.

## Advanced Usage

### Custom Extractors

For specialized certificate formats, you can create custom extraction functions:

```javascript
function extractCustomCertificate(apiResponse) {
  // Start with the standard extraction
  const baseData = extractCertificateData(apiResponse, "Custom Certificate");
  
  // Add custom fields or processing
  const customData = {
    ...baseData,
    organizationId: extractOrganizationId(apiResponse.markdown),
    customFields: extractCustomFields(apiResponse.markdown)
  };
  
  return customData;
}
```

### Integration with API

When integrating with the API:

```javascript
// Upload handler
const handleFileUploadComplete = (files, data) => {
  // Store document type from uploader
  if (data && data.documentType) {
    setProcessedData({
      ...data,
      documentType: data.documentType
    });
  } else {
    setProcessedData(data);
  }
  
  // Process the data for template display
  const certificateData = extractCertificateData(data, data.documentType);
  setExtractedTemplateData(certificateData);
};
```