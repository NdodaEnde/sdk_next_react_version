// Debug script for the original data

import * as structuredDataExtractor from './src/utils/structuredDataExtractor.js';

// Original test data
const originalMarkdown = `## Description of the Figure

The image is a logo for "Blue Collar Occupational Health." It features a stylized heart shape with a blue outline. Inside the heart, there is a blue line resembling a heartbeat or electrocardiogram (ECG) pattern. The heart is partially filled with a gray shape on the right side, which could represent a hand or a protective element.

Below the heart, the text "Blue Collar" is prominently displayed in blue, with "Occupational Health" written underneath in smaller, black letters. The overall design suggests a focus on health and safety, particularly in a work-related or industrial context. <!-- ChunkType.figure, from page 0 (l=0.06125,t=0.02032724844167409,r=0.16999999999999998,b=0.09810106856634017), with ID 16ef7a8d-0d7a-4b28-b077-fd8a81e8d134 -->

## Bluecollar Occupational Health

- **Tel**: +27 11 892 0771 / 011 892 0627
- **Email**: 
  - admin@bluecollarocc.co.za
  - office@bluecollarocc.co.za
- **Address**: 135 Leeupoort Street; Boksburg South; Boksburg <!-- ChunkType.page_header, from page 0 (l=0.52625,t=0.02474621549421193,r=0.95125,b=0.09898486197684772), with ID cabfe02c-4b04-44be-ab56-9cd1f2d91919 -->

# CERTIFICATE OF FITNESS <!-- ChunkType.title, from page 0 (l=0.35874999999999996,t=0.10693900267141584,r=0.66875,b=0.12373107747105966), with ID 86df9647-78c9-422f-80c8-aaf13f5aab07 -->

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

## Certification

- **Certifiers**:
  - Dr. MJ Mphuthi / Practice No: 0404160
  - Sr. Sibongile Mahlangu / Practice No: 999 088 0000 8177 91

This document certifies the examination details for the employee listed above. <!-- ChunkType.form, from page 0 (l=0.058750000000000004,t=0.13787177203918075,r=0.9662499999999999,b=0.3791473731077471), with ID aa84c1e0-5606-4d94-943f-d1890231d56d -->

## Document Information

Dr. MJ Mphuthi / Practice No: 0404160 / Sr. Sibongile Mahlangu / Practice No: 999 088 0000 8177 91

certify that the following employee: <!-- ChunkType.text, from page 0 (l=0.15875,t=0.1422907390917186,r=0.86375,b=0.16880454140694567), with ID 1c353d56-b1fe-40dc-b5b7-51022b59befe -->

## Medical Examination Conducted Includes the Following Tests <!-- ChunkType.text, from page 0 (l=0.21125,t=0.3791473731077471,r=0.8162499999999999,b=0.3924042742653607), with ID b7dd7a49-feab-478b-91b1-8899652e4804 -->

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
  - Results: N/A <!-- ChunkType.form, from page 0 (l=0.06625,t=0.40654496883348173,r=0.9625,b=0.5373463935886019), with ID 2f85fb19-6b24-4c01-975e-a59f6603e2b0 -->

## Referred or follow up actions:

Review Date: <!-- ChunkType.text, from page 0 (l=0.06999999999999999,t=0.5550222617987534,r=0.66125,b=0.570046749777382), with ID 2d8a6e05-79fa-4208-9186-33b720a355eb -->

## Restrictions

| Heights | Dust Exposure | Motorized Equipment | Wear Hearing Protection |
|---------|---------------|---------------------|-------------------------|
| Confined Spaces | Chemical Exposure | Wear Spectacles | Remain on Treatment for Chronic Conditions |

## Medical Fitness Declaration

| FIT | Fit with Restriction | Fit with Condition | Temporary Unfit | UNFIT |
|-----|----------------------|--------------------|-----------------|-------|
| [x] | [ ]                  | [ ]                | [ ]             | [ ]   |

**Comments:**  
(Blank space for comments) <!-- ChunkType.form, from page 0 (l=0.06,t=0.5726981300089047,r=0.97,b=0.8334171861086376), with ID cab7d702-ed6c-4504-b33e-b2cbb645efe3 -->

## Restrictions: <!-- ChunkType.text, from page 0 (l=0.45375,t=0.5762333036509351,r=0.57625,b=0.5903739982190561), with ID f470daae-fb15-43c0-96ca-90ba428ea443 -->

### Restrictions

<table>
  <tr>
    <td>Heights</td>
    <td>Dust Exposure</td>
    <td>Motorized Equipment</td>
    <td>Wear Hearing Protection</td>
  </tr>
  <tr>
    <td>Confined Spaces</td>
    <td>Chemical Exposure</td>
    <td>Wear Spectacles</td>
    <td>Remain on Treatment for Chronic Conditions</td>
  </tr>
</table> <!-- ChunkType.form, from page 0 (l=0.058750000000000004,t=0.5859550311665183,r=0.96875,b=0.6575422974176313), with ID 2091e53b-dc39-4af8-83d3-2c8fc1dde0ce -->

## Medical Fitness Declaration

The text in the image is "Medical Fitness Declaration." There are no checkboxes, key-value pairs, tables, or equations present in this crop. <!-- ChunkType.text, from page 0 (l=0.37999999999999995,t=0.6575422974176313,r=0.65125,b=0.67256678539626), with ID 21535a90-2d17-4609-9d3c-5962bd10e1e5 -->

## Document Details

### Occupational Health Practitioner / Occupational Medical Practitioner

- **Dr MJ Mphuthi**
  - **Practice No.**: 0404160

- **Sr. Sibongile Mahlangu**
  - **SANC No.**: 14262133
  - **SASOHN No.**: AR 2136
  - **MBCHB DOH**

- **Practice Number**: 999 088 0000 8177 91

### Signature and Stamp

- **Signature**: [Space for signature]
- **Stamp**: [Space for stamp] <!-- ChunkType.key_value, from page 0 (l=0.06375,t=0.8528606411398041,r=0.9412499999999999,b=0.9200289403383792), with ID faa4c4b1-7058-456e-9f2c-872c37d4d1f5 -->`;

async function runOriginalDataTest() {
  try {
    console.log("Starting extraction test with original data...");
    
    // Extract all forms
    const forms = structuredDataExtractor.extractAllForms(originalMarkdown);
    console.log("Forms extracted:", forms.length);
    forms.forEach((form, i) => {
      console.log(`Form ${i+1} type: ${form.type}`);
      console.log(`Content preview: ${form.content.substring(0, 50)}...`);
    });
    
    // Extract all tables
    const tables = structuredDataExtractor.extractAllTables(originalMarkdown);
    console.log("Tables extracted:", tables.length);
    tables.forEach((table, i) => {
      console.log(`Table ${i+1} type: ${table.type}`);
      console.log(`Headers: ${table.headers.join(', ')}`);
      console.log(`Rows: ${table.rows.length}`);
    });
    
    // Extract key-values
    const keyValues = structuredDataExtractor.extractAllKeyValues(originalMarkdown);
    console.log("Key-Values extracted:", keyValues.length);
    keyValues.slice(0, 10).forEach((kv, i) => {
      console.log(`KeyValue ${i+1}: ${kv.key} = ${kv.value}`);
    });
    
    // Try full extraction
    const result = structuredDataExtractor.extractStructuredDataFromMarkdown(originalMarkdown);
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
    console.error("Error during original data test:", error);
    console.error(error.stack);
  }
}

// Run the test
runOriginalDataTest();