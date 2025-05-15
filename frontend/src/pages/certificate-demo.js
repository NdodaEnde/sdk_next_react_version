import React, { useState } from 'react';
import SimpleLayout from '../components/SimpleLayout';
import CertificateTemplate from '../components/templates/CertificateTemplate';
import EditableCertificate from '../components/templates/EditableCertificate';
import { extractCertificateData } from '../utils/certificateExtractor';

export default function CertificateDemo() {
  const [selectedTemplate, setSelectedTemplate] = useState('example1');
  const [showRawData, setShowRawData] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  // Example API responses with different certificate data
  const examples = {
    example1: {
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
    },
    example2: {
      status: 'success',
      markdown: `
# Certificate of Fitness

## Patient Information
**Initials & Surname**: M.D. Smith
**ID NO**: 8803126547890
**Company Name**: Construction Solutions Ltd
**Date of Examination**: 2025-05-01
**Expiry Date**: 2026-05-01
**Job Title**: Site Supervisor

## Examination Type
PRE-EMPLOYMENT [x]
PERIODICAL [ ]
EXIT [ ]

## Medical Examination Tests
| Test | Done | Results |
| --- | --- | --- |
| BLOODS | [x] | Normal |
| FAR, NEAR VISION | [x] | 20/30 |
| SIDE & DEPTH | [x] | Normal |
| NIGHT VISION | [x] | 20/40 |
| Hearing | [x] | 0.2 |
| Working at Heights | [x] | Pass |
| Lung Function | [x] | MODERATE RESTRICTION |
| X-Ray | [x] | Clear |
| Drug Screen | [x] | Negative |

## Restrictions
Heights [x]
Dust Exposure [x]
Motorized Equipment [ ]
Wear Hearing Protection [x]
Confined Spaces [x]
Chemical Exposure [x]
Wear Spectacles [ ]
Remain on Treatment for Chronic Conditions [ ]

## Medical Fitness Declaration
FIT [ ]
Fit with Restriction [x]
Fit with Condition [ ]
Temporary Unfit [ ]
UNFIT [ ]

Referred or follow up actions: Follow up on lung function in 3 months
Review Date: 2025-08-01
Comments: Patient is fit for work with restrictions due to moderate lung function impairment. Must avoid dust exposure and confined spaces.
      `,
      evidence: {
        "certificate.pdf:1": [
          {
            "captions": [
              "Certificate of Fitness",
              "M.D. Smith",
              "ID: 8803126547890",
              "Construction Solutions Ltd",
              "Site Supervisor"
            ]
          }
        ]
      }
    },
    example3: {
      status: 'success',
      markdown: `
# BLUECOLLAR OCCUPATIONAL HEALTH
## CERTIFICATE OF FITNESS

Dr. MJ Mputhi / Practice No: 0404160 / Sr. Sibongile Mahlangu / Practice No: 999 088 0000 8177 91

**Initials & Surname**: J.T. Brown
**ID NO**: 9201015839071
**Company Name**: Industrial Manufacturing Inc
**Date of Examination**: 2025-03-15
**Expiry Date**: 2026-03-15
**Job Title**: Machine Operator

## Examination Type
PRE-EMPLOYMENT [ ]
PERIODICAL [x]
EXIT [ ]

## MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS

| | Done | Results |
| --- | --- | --- |
| BLOODS | ✓ | Normal |
| FAR, NEAR VISION | ✓ | 20/25 |
| SIDE & DEPTH | ✓ | Normal |
| NIGHT VISION | ✓ | 20/30 |
| Hearing | ✓ | 0.5 |
| Working at Heights | | N/A |
| Lung Function | ✓ | Normal |
| X-Ray | ✓ | Clear |
| Drug Screen | ✓ | Negative |

Referred or follow up actions: 

Review Date: 2025-09-15

## Restrictions:
Heights [ ]
Dust Exposure [ ]
Motorized Equipment [ ]
Wear Hearing Protection [x]
Confined Spaces [ ]
Chemical Exposure [ ]
Wear Spectacles [x]
Remain on Treatment for Chronic Conditions [ ]

## Medical Fitness Declaration
FIT [x]
Fit with Restriction [ ]
Fit with Condition [ ]
Temporary Unfit [ ]
UNFIT [ ]

Comments: Patient is fit for all duties with hearing protection and corrective lenses required.
      `,
      evidence: {
        "certificate.pdf:1": [
          {
            "captions": [
              "BLUECOLLAR OCCUPATIONAL HEALTH",
              "CERTIFICATE OF FITNESS",
              "J.T. Brown",
              "9201015839071",
              "Industrial Manufacturing Inc",
              "Machine Operator"
            ]
          }
        ]
      }
    }
  };

  // Process the selected example data
  const processedData = extractCertificateData(examples[selectedTemplate], "Certificate of Fitness");
  
  // Use the edited data if available, otherwise use the processed data
  const displayData = certificateData || processedData;
  
  // Handle save from editable certificate
  const handleSaveCertificate = (data) => {
    setCertificateData(data);
    setEditMode(false);
  };
  
  // Handle export to JSON function
  const handleExportToJson = () => {
    const dataStr = JSON.stringify(displayData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileName = `certificate_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };

  return (
    <SimpleLayout title="Certificate Template Demo">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Certificate Template Demo</h1>
        <p className="text-gray-600 mb-4">
          This page demonstrates how the certificate template is populated with different data formats.
          Select an example below to see how the template adapts to different certificate types and data structures.
        </p>
      </div>

      {/* Controls for template selection and display options */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Example Template
          </label>
          <select
            id="template-select"
            value={selectedTemplate}
            onChange={(e) => {
              setSelectedTemplate(e.target.value);
              setCertificateData(null); // Reset edited data when template changes
            }}
            disabled={editMode}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="example1">Example 1: Standard Certificate</option>
            <option value="example2">Example 2: Certificate with Restrictions</option>
            <option value="example3">Example 3: BLUECOLLAR Format</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={showRawData}
              onChange={() => setShowRawData(!showRawData)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Show Extracted Data</span>
          </label>
          
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              editMode 
                ? 'text-blue-700 bg-blue-100 hover:bg-blue-200' 
                : 'text-white bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {editMode ? 'Cancel Edit' : 'Edit Certificate'}
          </button>
        </div>
      </div>

      {/* Display the raw extracted data if option is selected */}
      {showRawData && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg overflow-auto max-h-80">
          <h2 className="text-lg font-medium mb-2">Certificate Data</h2>
          <pre className="text-xs">{JSON.stringify(displayData, null, 2)}</pre>
        </div>
      )}

      {/* Certificate display - toggle between view and edit mode */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white mb-8">
        <h2 className="text-lg font-medium mb-4">
          {editMode ? 'Edit Certificate' : 'Certificate Template'}
        </h2>
        
        {editMode ? (
          <EditableCertificate data={displayData} onSave={handleSaveCertificate} />
        ) : (
          <CertificateTemplate data={displayData} />
        )}
      </div>

      {/* Actions button - only show when not in edit mode */}
      {!editMode && (
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleExportToJson}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export to JSON
          </button>
          
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Certificate
          </button>
        </div>
      )}
    </SimpleLayout>
  );
}