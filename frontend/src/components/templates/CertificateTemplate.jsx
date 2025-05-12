import React, { useMemo } from 'react';

export default function CertificateTemplate({ data }) {
  // Handle null or undefined data
  const safeData = data || {};

  // Extract data with fallbacks for all fields
  const {
    // Employee details
    name = '',
    id_number = '',
    company = '',
    exam_date = '',
    expiry_date = '',
    job = '',

    // Examination type - check for both keys
    examinationType = '',
    examination_type = '',

    // Medical exams with defaults - check for both naming conventions
    medicalExams = {},
    medical_exams = {},

    medicalResults = {},
    medical_results = {},

    // Fitness declaration - check for both naming conventions
    fitnessDeclaration = '',
    fitness_declaration = '',

    // Restrictions with defaults
    restrictions = {},

    // Other fields
    referral = '',
    review_date = '',
    comments = ''
  } = safeData;

  // Merge medical exams from both naming conventions - use useMemo for performance
  const combinedMedicalExams = useMemo(() => {
    return {
      ...medical_exams,
      ...medicalExams
    };
  }, [medical_exams, medicalExams]);

  // Merge medical results from both naming conventions
  const combinedMedicalResults = useMemo(() => {
    return {
      ...medical_results,
      ...medicalResults
    };
  }, [medical_results, medicalResults]);

  // Create safe objects with defaults for nested properties
  const safeExams = useMemo(() => ({
    blood: false,
    vision: false,
    depthVision: false,
    nightVision: false,
    hearing: false,
    heights: false,
    lung: false,
    xray: false,
    drugScreen: false,
    ...combinedMedicalExams
  }), [combinedMedicalExams]);

  // Get restrictions from all possible sources (direct, nested, etc.)
  const effectiveRestrictions = useMemo(() => {
    return {
      ...restrictions,
      ...(safeData.checkboxes?.restrictions || {})  // Some extractors store restrictions under checkboxes
    };
  }, [restrictions, safeData.checkboxes]);

  const safeRestrictions = useMemo(() => ({
    heights: false,
    dust: false,
    motorized: false,
    hearingProtection: false,
    confinedSpaces: false,
    chemical: false,
    spectacles: false,
    treatment: false,
    chronicConditions: false,  // Add chronicConditions for compatibility
    ...effectiveRestrictions
  }), [effectiveRestrictions]);

  // Map fitness declaration values to standardized format
  const normalizeFitnessValue = (value) => {
    const mapping = {
      'fit': 'fit',
      'fit_with_restriction': 'fitWithRestriction',
      'fit_with_conditions': 'fitWithCondition',
      'fit_with_condition': 'fitWithCondition',
      'fitWithRestriction': 'fitWithRestriction',
      'fitWithCondition': 'fitWithCondition',
      'temporary_unfit': 'temporaryUnfit',
      'temporaryUnfit': 'temporaryUnfit',
      'unfit': 'unfit'
    };
    return mapping[value] || value;
  };

  // Helper function to determine if a checkbox should be marked - enhanced for better handling
  const isChecked = (value) => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      // Don't count "[x]" as checked - we want to display just the checkmark
      if (value === '[x]') return false;

      const lowerVal = value.toLowerCase();
      return lowerVal === 'true' ||
             lowerVal === 'yes' ||
             lowerVal === 'checked' ||
             lowerVal === '1' ||
             lowerVal === 'x';
    }
    return false;
  };

  // Helper function to determine active fitness declaration - check both naming conventions and normalize
  const isFitnessDeclared = (type) => {
    return normalizeFitnessValue(fitness_declaration) === type ||
           normalizeFitnessValue(fitnessDeclaration) === type;
  };

  // Determine examination type from either naming convention
  const effectiveExaminationType = examination_type || examinationType || '';

  // Helper to get medical result with fallbacks
  const getMedicalResult = (fieldName) => {
    return combinedMedicalResults[fieldName] ||
           combinedMedicalResults[fieldName.toLowerCase()] ||
           combinedMedicalResults[fieldName.replace(/([A-Z])/g, '_$1').toLowerCase()] ||
           '';
  };

  // Format dates consistently
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr;
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-300 max-w-3xl mx-auto text-sm relative overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none z-0">
        <img
          src="/images/templates/company_logos.png"
          alt="Watermark"
          className="w-full max-w-[700px] h-auto"
          onError={(e) => {
            e.target.src = "/images/templates/default.png";
            console.error("Failed to load watermark image");
          }}
        />
      </div>

      {/* All other content should have z-10 to appear above watermark */}
      <div className="relative z-10">
        {/* Header with logo and company info */}
        <div className="flex justify-between items-start">
          <div className="w-32 h-16">
            <img
              src="/images/templates/company_logos.png"
              alt="Company Logo"
              className="w-full h-full object-contain opacity-100"
              onError={(e) => {
                e.target.src = "/images/templates/default.png";
                console.error("Failed to load company logo");
              }}
            />
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-blue-900">BLUECOLLAR OCCUPATIONAL HEALTH</h2>
            <p className="text-xs text-gray-600">Tel: +27 11 892 0771/ 011 892 0627</p>
            <p className="text-xs text-gray-600">Email: admin@bluecollarocc.co.za</p>
            <p className="text-xs text-gray-600">office@bluecollarocc.co.za</p>
            <p className="text-xs text-gray-600">135 Leeuwpoort Street; Boksburg South; Boksburg</p>
          </div>
        </div>

        {/* Certificate Title with dark blue background */}
        <div className="bg-blue-900 text-white text-center py-2 mb-3">
          <h1 className="text-xl font-bold">CERTIFICATE OF FITNESS</h1>
        </div>

        {/* Doctor info */}
        <div className="text-center mb-3 text-xs">
          <p className="font-semibold">Dr. MJ Mputhi / Practice No: 0404160 / Sr. Sibongile Mahlangu / Practice No: 999 088 0000 8177 91</p>
          <p>certify that the following employee:</p>
        </div>

        {/* Employee Details */}
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="flex items-center">
              <span className="font-semibold mr-2">Initials & Surname:</span>
              <div className={`flex-1 border-b-2 border-gray-400 h-5 flex items-center ${name ? 'bg-blue-50' : ''}`}>
                {name && <span className="px-1">{name}</span>}
              </div>
            </div>
            <div className="flex items-center">
              <span className="font-semibold mr-2">ID NO:</span>
              <div className={`flex-1 border-b-2 border-gray-400 h-5 flex items-center ${id_number ? 'bg-blue-50' : ''}`}>
                {id_number && <span className="px-1">{id_number}</span>}
              </div>
            </div>
          </div>

          <div className="mb-2 flex items-center">
            <span className="font-semibold mr-2">Company Name:</span>
            <div className={`flex-1 border-b-2 border-gray-400 h-5 flex items-center ${company ? 'bg-blue-50' : ''}`}>
              {company && <span className="px-1">{company}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="flex items-center">
              <span className="font-semibold mr-2">Date of Examination:</span>
              <div className={`flex-1 border-b-2 border-gray-400 h-5 flex items-center ${exam_date ? 'bg-blue-50' : ''}`}>
                {exam_date && <span className="px-1">{formatDate(exam_date)}</span>}
              </div>
            </div>
            <div className="flex items-center">
              <span className="font-semibold mr-2">Expiry Date:</span>
              <div className={`flex-1 border-b-2 border-gray-400 h-5 flex items-center ${expiry_date ? 'bg-blue-50' : ''}`}>
                {expiry_date && <span className="px-1">{formatDate(expiry_date)}</span>}
              </div>
            </div>
          </div>

          <div className="mb-2 flex items-center">
            <span className="font-semibold mr-2">Job Title:</span>
            <div className={`flex-1 border-b-2 border-gray-400 h-5 flex items-center ${job ? 'bg-blue-50' : ''}`}>
              {job && <span className="px-1">{job}</span>}
            </div>
          </div>
        </div>

        {/* Examination Type - Reduced size */}
        <div className="flex justify-center mb-2">
          <table className="border-collapse w-1/2">
            <tbody>
              <tr>
                <td className="border-2 border-black px-2 py-0.5 text-center font-bold text-xs">PRE-EMPLOYMENT</td>
                <td className="border-2 border-black px-2 py-0.5 text-center font-bold text-xs">PERIODICAL</td>
                <td className="border-2 border-black px-2 py-0.5 text-center font-bold text-xs">EXIT</td>
              </tr>
              <tr>
                <td className={`border-2 border-black border-t-0 px-2 py-0.5 text-center ${effectiveExaminationType === 'pre-employment' ? 'bg-blue-100' : ''}`}>
                  <div className="text-sm">{effectiveExaminationType === 'pre-employment' ? '✓' : ''}</div>
                </td>
                <td className={`border-2 border-black border-t-0 px-2 py-0.5 text-center ${effectiveExaminationType === 'periodical' ? 'bg-blue-100' : ''}`}>
                  <div className="text-sm">{effectiveExaminationType === 'periodical' ? '✓' : ''}</div>
                </td>
                <td className={`border-2 border-black border-t-0 px-2 py-0.5 text-center ${effectiveExaminationType === 'exit' ? 'bg-blue-100' : ''}`}>
                  <div className="text-sm">{effectiveExaminationType === 'exit' ? '✓' : ''}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Medical Examination Tests */}
        <div className="bg-blue-900 text-white text-center py-1 mb-3">
          <h3 className="font-bold text-sm">MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-gray-400 p-1 bg-blue-100" rowSpan="2"></th>
                  <th className="border border-gray-400 p-1 bg-blue-100">Done</th>
                  <th className="border border-gray-400 p-1 bg-blue-100">Results</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-1 font-semibold">BLOODS</td>
                  <td className={`border border-gray-400 p-1 text-center ${isChecked(safeExams.blood) ? 'bg-blue-50' : ''}`}>
                    {isChecked(safeExams.blood) ? '✓' : ''}
                  </td>
                  <td className="border border-gray-400 p-1">
                    {getMedicalResult('blood')}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1 font-semibold">FAR, NEAR VISION</td>
                  <td className={`border border-gray-400 p-1 text-center ${isChecked(safeExams.vision) ? 'bg-blue-50' : ''}`}>
                    {isChecked(safeExams.vision) ? '✓' : ''}
                  </td>
                  <td className="border border-gray-400 p-1">
                    {getMedicalResult('vision')}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1 font-semibold">SIDE & DEPTH</td>
                  <td className={`border border-gray-400 p-1 text-center ${isChecked(safeExams.depthVision) ? 'bg-blue-50' : ''}`}>
                    {isChecked(safeExams.depthVision) ? '✓' : ''}
                  </td>
                  <td className="border border-gray-400 p-1">
                    {getMedicalResult('depthVision')}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1 font-semibold">NIGHT VISION</td>
                  <td className={`border border-gray-400 p-1 text-center ${isChecked(safeExams.nightVision) ? 'bg-blue-50' : ''}`}>
                    {isChecked(safeExams.nightVision) ? '✓' : ''}
                  </td>
                  <td className="border border-gray-400 p-1">
                    {getMedicalResult('nightVision')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-gray-400 p-1 bg-blue-100" rowSpan="2"></th>
                  <th className="border border-gray-400 p-1 bg-blue-100">Done</th>
                  <th className="border border-gray-400 p-1 bg-blue-100">Results</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-1 font-semibold">Hearing</td>
                  <td className={`border border-gray-400 p-1 text-center ${isChecked(safeExams.hearing) ? 'bg-blue-50' : ''}`}>
                    {isChecked(safeExams.hearing) ? '✓' : ''}
                  </td>
                  <td className="border border-gray-400 p-1">
                    {getMedicalResult('hearing')}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1 font-semibold">Working at Heights</td>
                  <td className={`border border-gray-400 p-1 text-center ${isChecked(safeExams.heights) ? 'bg-blue-50' : ''}`}>
                    {isChecked(safeExams.heights) ? '✓' : ''}
                  </td>
                  <td className="border border-gray-400 p-1">
                    {getMedicalResult('heights')}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1 font-semibold">Lung Function</td>
                  <td className={`border border-gray-400 p-1 text-center ${isChecked(safeExams.lung) ? 'bg-blue-50' : ''}`}>
                    {isChecked(safeExams.lung) ? '✓' : ''}
                  </td>
                  <td className="border border-gray-400 p-1">
                    {getMedicalResult('lung')}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1 font-semibold">X-Ray</td>
                  <td className={`border border-gray-400 p-1 text-center ${isChecked(safeExams.xray) ? 'bg-blue-50' : ''}`}>
                    {isChecked(safeExams.xray) ? '✓' : ''}
                  </td>
                  <td className="border border-gray-400 p-1">
                    {getMedicalResult('xray')}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1 font-semibold">Drug Screen</td>
                  <td className={`border border-gray-400 p-1 text-center ${isChecked(safeExams.drugScreen) ? 'bg-blue-50' : ''}`}>
                    {isChecked(safeExams.drugScreen) ? '✓' : ''}
                  </td>
                  <td className="border border-gray-400 p-1">
                    {getMedicalResult('drugScreen')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Referral and Review Date - More compact */}
        <div className="grid grid-cols-2 text-xs">
          <div className="border border-gray-400">
            <div className="px-1 py-0.5">
              <span className="font-semibold">Referred or follow up actions:</span>
            </div>
            <div className={`px-1 pb-1 ${referral ? 'bg-blue-50' : ''}`}>
              {referral || ''}
            </div>
          </div>
          <div className="border border-gray-400 border-l-0">
            <div className="px-1 py-0.5">
              <span className="font-semibold text-red-600">Review Date:</span>
            </div>
            <div className={`px-1 pb-1 ${review_date ? 'bg-blue-50' : ''}`}>
              {formatDate(review_date) || ''}
            </div>
          </div>
        </div>

        {/* Restrictions - Reduced text size */}
        <div className="bg-blue-900 text-white text-center py-1">
          <h3 className="font-bold text-sm">Restrictions:</h3>
        </div>

        <table className="w-full border-collapse text-xs">
          <tbody>
            <tr>
              <td className={`border border-gray-400 p-2 text-center ${isChecked(safeRestrictions.heights) ? 'bg-blue-100' : ''}`}>
                Heights {isChecked(safeRestrictions.heights) ? '✓' : ''}
              </td>
              <td className={`border border-gray-400 p-2 text-center ${isChecked(safeRestrictions.dust) ? 'bg-blue-100' : ''}`}>
                Dust Exposure {isChecked(safeRestrictions.dust) ? '✓' : ''}
              </td>
              <td className={`border border-gray-400 p-2 text-center ${isChecked(safeRestrictions.motorized) ? 'bg-blue-100' : ''}`}>
                Motorized Equipment {isChecked(safeRestrictions.motorized) ? '✓' : ''}
              </td>
              <td className={`border border-gray-400 p-2 text-center ${isChecked(safeRestrictions.hearingProtection) ? 'bg-blue-100' : ''}`}>
                Wear Hearing Protection {isChecked(safeRestrictions.hearingProtection) ? '✓' : ''}
              </td>
            </tr>
            <tr>
              <td className={`border border-gray-400 p-2 text-center ${isChecked(safeRestrictions.confinedSpaces) ? 'bg-blue-100' : ''}`}>
                Confined Spaces {isChecked(safeRestrictions.confinedSpaces) ? '✓' : ''}
              </td>
              <td className={`border border-gray-400 p-2 text-center ${isChecked(safeRestrictions.chemical) ? 'bg-blue-100' : ''}`}>
                Chemical Exposure {isChecked(safeRestrictions.chemical) ? '✓' : ''}
              </td>
              <td className={`border border-gray-400 p-2 text-center ${isChecked(safeRestrictions.spectacles) ? 'bg-blue-100' : ''}`}>
                Wear Spectacles {isChecked(safeRestrictions.spectacles) ? '✓' : ''}
              </td>
              <td className={`border border-gray-400 p-2 text-center ${isChecked(safeRestrictions.treatment || safeRestrictions.chronicConditions) ? 'bg-blue-100' : ''}`}>
                Remain on Treatment for Chronic Conditions {isChecked(safeRestrictions.treatment || safeRestrictions.chronicConditions) ? '✓' : ''}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Medical Fitness Declaration */}
        <div className="bg-blue-900 text-white text-center py-1">
          <h3 className="font-bold text-sm">Medical Fitness Declaration</h3>
        </div>

        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className={`border-2 border-black p-2 text-center font-bold text-sm ${isFitnessDeclared('fit') ? 'bg-green-200' : ''}`}>
                FIT {isFitnessDeclared('fit') ? '✓' : ''}
              </td>
              <td className={`border-2 border-black p-2 text-center text-sm ${isFitnessDeclared('fitWithRestriction') ? 'bg-yellow-100' : ''}`}>
                Fit with Restriction {isFitnessDeclared('fitWithRestriction') ? '✓' : ''}
              </td>
              <td className={`border-2 border-black p-2 text-center text-sm ${isFitnessDeclared('fitWithCondition') ? 'bg-yellow-100' : ''}`}>
                Fit with Condition {isFitnessDeclared('fitWithCondition') ? '✓' : ''}
              </td>
              <td className={`border-2 border-black p-2 text-center text-sm ${isFitnessDeclared('temporaryUnfit') ? 'bg-red-100' : ''}`}>
                Temporary Unfit {isFitnessDeclared('temporaryUnfit') ? '✓' : ''}
              </td>
              <td className={`border-2 border-black p-2 text-center text-sm ${isFitnessDeclared('unfit') ? 'bg-red-200' : ''}`}>
                UNFIT {isFitnessDeclared('unfit') ? '✓' : ''}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Comments - Connected directly to the table above */}
        <div className="border-2 border-black border-t-0">
          <div className="p-2">
            <span className="font-semibold text-sm">Comments:</span>
            <div className={`mt-2 space-y-6 p-1 ${comments ? 'bg-blue-50' : ''}`}>
              {comments || ''}
            </div>
          </div>
        </div>

        {/* Signature and Stamp with document details in between */}
        <div className="grid grid-cols-3 gap-4 mt-4 items-end">
          <div className="text-center">
            <div className="border-b-2 border-gray-400 h-10"></div>
            <p className="font-semibold mt-1">SIGNATURE</p>
          </div>

          {/* Document details in the middle */}
          <div className="text-center" style={{ fontSize: '10px' }}>
            <p className="font-semibold">Occupational Health Practitioner / Occupational Medical Practitioner</p>
            <p>Dr MJ Mphuthi / Practice No. 0404160</p>
            <p>Sr. Sibongile Mahlangu</p>
            <p>SANC No: 14262133; SASOHN No: AR 2136 / MBCHB DOH</p>
            <p>Practice Number: 999 088 0000 8177 91</p>
          </div>

          <div className="text-center">
            <div className="border-2 border-gray-400 h-10"></div>
            <p className="font-semibold mt-1">STAMP</p>
          </div>
        </div>
      </div>
    </div>
  );
}