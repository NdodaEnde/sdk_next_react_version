import React, { useState, useEffect } from 'react';

const EditableCertificate = ({ data, onSave }) => {
  // State to hold editable certificate data
  const [editableData, setEditableData] = useState({ ...data });
  
  // Update internal state when incoming data changes
  useEffect(() => {
    setEditableData({ ...data });
  }, [data]);
  
  // Handle input changes
  const handleChange = (field, value) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle nested field changes (like patient.name)
  const handleNestedChange = (parent, field, value) => {
    setEditableData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };
  
  // Handle checkbox/boolean changes
  const handleBooleanChange = (category, field, checked) => {
    setEditableData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: checked
      }
    }));
  };
  
  // Handle save button click
  const handleSave = () => {
    if (typeof onSave === 'function') {
      onSave(editableData);
    }
  };
  
  // Helper function to format dates consistently
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr;
  };
  
  return (
    <div className="space-y-6 p-4 bg-white rounded-lg border border-gray-300">
      <div className="bg-blue-900 text-white text-center py-2 mb-3">
        <h1 className="text-xl font-bold">EDITABLE CERTIFICATE OF FITNESS</h1>
      </div>
      
      {/* Patient Information Section */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4 text-blue-800 border-b pb-2">Patient Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={editableData.patient?.name || ''}
              onChange={(e) => handleNestedChange('patient', 'name', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
            <input
              type="text"
              value={editableData.patient?.employee_id || editableData.id_number || ''}
              onChange={(e) => {
                handleNestedChange('patient', 'employee_id', e.target.value);
                handleChange('id_number', e.target.value);
              }}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              value={editableData.patient?.company || editableData.company || ''}
              onChange={(e) => {
                handleNestedChange('patient', 'company', e.target.value);
                handleChange('company', e.target.value);
              }}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input
              type="text"
              value={editableData.patient?.occupation || editableData.job || ''}
              onChange={(e) => {
                handleNestedChange('patient', 'occupation', e.target.value);
                handleChange('job', e.target.value);
              }}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Examination</label>
            <input
              type="date"
              value={formatDate(editableData.examination_results?.date || editableData.exam_date || '')}
              onChange={(e) => {
                handleNestedChange('examination_results', 'date', e.target.value);
                handleChange('exam_date', e.target.value);
              }}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              value={formatDate(editableData.certification?.valid_until || editableData.expiry_date || '')}
              onChange={(e) => {
                handleNestedChange('certification', 'valid_until', e.target.value);
                handleChange('expiry_date', e.target.value);
              }}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={editableData.patient?.gender || 'unknown'}
              onChange={(e) => handleNestedChange('patient', 'gender', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Examination Type Section */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4 text-blue-800 border-b pb-2">Examination Type</h2>
        <div className="flex space-x-6">
          <label className="inline-flex items-center">
            <input
              type="radio"
              checked={editableData.examinationType === 'pre-employment' || editableData.examination_results?.type?.pre_employment}
              onChange={() => {
                handleChange('examinationType', 'pre-employment');
                handleNestedChange('examination_results', 'type', {
                  pre_employment: true,
                  periodical: false,
                  exit: false
                });
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Pre-Employment</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              checked={editableData.examinationType === 'periodical' || editableData.examination_results?.type?.periodical}
              onChange={() => {
                handleChange('examinationType', 'periodical');
                handleNestedChange('examination_results', 'type', {
                  pre_employment: false,
                  periodical: true,
                  exit: false
                });
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Periodical</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              checked={editableData.examinationType === 'exit' || editableData.examination_results?.type?.exit}
              onChange={() => {
                handleChange('examinationType', 'exit');
                handleNestedChange('examination_results', 'type', {
                  pre_employment: false,
                  periodical: false,
                  exit: true
                });
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">Exit</span>
          </label>
        </div>
      </div>
      
      {/* Medical Examinations Section */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4 text-blue-800 border-b pb-2">Medical Examination Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vision Tests */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Vision Tests</h3>
            
            {/* Blood Test */}
            <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editableData.medicalExams?.blood || false}
                  onChange={(e) => handleNestedChange('medicalExams', 'blood', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Bloods</span>
              </div>
              <input
                type="text"
                value={editableData.medicalResults?.blood || ''}
                onChange={(e) => handleNestedChange('medicalResults', 'blood', e.target.value)}
                placeholder="Result"
                className="w-1/2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Vision Test */}
            <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editableData.medicalExams?.vision || false}
                  onChange={(e) => handleNestedChange('medicalExams', 'vision', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Far, Near Vision</span>
              </div>
              <input
                type="text"
                value={editableData.medicalResults?.vision || ''}
                onChange={(e) => handleNestedChange('medicalResults', 'vision', e.target.value)}
                placeholder="Result"
                className="w-1/2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Depth Vision Test */}
            <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editableData.medicalExams?.depthVision || false}
                  onChange={(e) => handleNestedChange('medicalExams', 'depthVision', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Side & Depth</span>
              </div>
              <input
                type="text"
                value={editableData.medicalResults?.depthVision || ''}
                onChange={(e) => handleNestedChange('medicalResults', 'depthVision', e.target.value)}
                placeholder="Result"
                className="w-1/2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Night Vision Test */}
            <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editableData.medicalExams?.nightVision || false}
                  onChange={(e) => handleNestedChange('medicalExams', 'nightVision', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Night Vision</span>
              </div>
              <input
                type="text"
                value={editableData.medicalResults?.nightVision || ''}
                onChange={(e) => handleNestedChange('medicalResults', 'nightVision', e.target.value)}
                placeholder="Result"
                className="w-1/2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Other Tests */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">Other Tests</h3>
            
            {/* Hearing Test */}
            <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editableData.medicalExams?.hearing || false}
                  onChange={(e) => handleNestedChange('medicalExams', 'hearing', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Hearing</span>
              </div>
              <input
                type="text"
                value={editableData.medicalResults?.hearing || ''}
                onChange={(e) => handleNestedChange('medicalResults', 'hearing', e.target.value)}
                placeholder="Result"
                className="w-1/2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Heights Test */}
            <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editableData.medicalExams?.heights || false}
                  onChange={(e) => handleNestedChange('medicalExams', 'heights', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Working at Heights</span>
              </div>
              <input
                type="text"
                value={editableData.medicalResults?.heights || ''}
                onChange={(e) => handleNestedChange('medicalResults', 'heights', e.target.value)}
                placeholder="Result"
                className="w-1/2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Lung Function Test */}
            <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editableData.medicalExams?.lung || false}
                  onChange={(e) => handleNestedChange('medicalExams', 'lung', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Lung Function</span>
              </div>
              <input
                type="text"
                value={editableData.medicalResults?.lung || ''}
                onChange={(e) => handleNestedChange('medicalResults', 'lung', e.target.value)}
                placeholder="Result"
                className="w-1/2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* X-Ray Test */}
            <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editableData.medicalExams?.xray || false}
                  onChange={(e) => handleNestedChange('medicalExams', 'xray', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">X-Ray</span>
              </div>
              <input
                type="text"
                value={editableData.medicalResults?.xray || ''}
                onChange={(e) => handleNestedChange('medicalResults', 'xray', e.target.value)}
                placeholder="Result"
                className="w-1/2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Drug Screen Test */}
            <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editableData.medicalExams?.drugScreen || false}
                  onChange={(e) => handleNestedChange('medicalExams', 'drugScreen', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Drug Screen</span>
              </div>
              <input
                type="text"
                value={editableData.medicalResults?.drugScreen || ''}
                onChange={(e) => handleNestedChange('medicalResults', 'drugScreen', e.target.value)}
                placeholder="Result"
                className="w-1/2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Restrictions Section */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4 text-blue-800 border-b pb-2">Restrictions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="inline-flex items-center p-2 rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={editableData.restrictions?.heights || false}
              onChange={(e) => handleNestedChange('restrictions', 'heights', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Heights</span>
          </label>
          <label className="inline-flex items-center p-2 rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={editableData.restrictions?.dust || false}
              onChange={(e) => handleNestedChange('restrictions', 'dust', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Dust Exposure</span>
          </label>
          <label className="inline-flex items-center p-2 rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={editableData.restrictions?.motorized || false}
              onChange={(e) => handleNestedChange('restrictions', 'motorized', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Motorized Equipment</span>
          </label>
          <label className="inline-flex items-center p-2 rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={editableData.restrictions?.hearingProtection || false}
              onChange={(e) => handleNestedChange('restrictions', 'hearingProtection', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Wear Hearing Protection</span>
          </label>
          <label className="inline-flex items-center p-2 rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={editableData.restrictions?.confinedSpaces || false}
              onChange={(e) => handleNestedChange('restrictions', 'confinedSpaces', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Confined Spaces</span>
          </label>
          <label className="inline-flex items-center p-2 rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={editableData.restrictions?.chemical || false}
              onChange={(e) => handleNestedChange('restrictions', 'chemical', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Chemical Exposure</span>
          </label>
          <label className="inline-flex items-center p-2 rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={editableData.restrictions?.spectacles || false}
              onChange={(e) => handleNestedChange('restrictions', 'spectacles', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Wear Spectacles</span>
          </label>
          <label className="inline-flex items-center p-2 rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={editableData.restrictions?.treatment || false}
              onChange={(e) => handleNestedChange('restrictions', 'treatment', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Remain on Treatment</span>
          </label>
        </div>
      </div>
      
      {/* Fitness Declaration Section */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4 text-blue-800 border-b pb-2">Medical Fitness Declaration</h2>
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-green-50 hover:bg-green-100">
            <input
              type="radio"
              checked={editableData.fitnessDeclaration === 'fit'}
              onChange={() => handleChange('fitnessDeclaration', 'fit')}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">FIT</span>
          </label>
          <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-yellow-50 hover:bg-yellow-100">
            <input
              type="radio"
              checked={editableData.fitnessDeclaration === 'fitWithRestriction'}
              onChange={() => handleChange('fitnessDeclaration', 'fitWithRestriction')}
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">Fit with Restriction</span>
          </label>
          <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-yellow-50 hover:bg-yellow-100">
            <input
              type="radio"
              checked={editableData.fitnessDeclaration === 'fitWithCondition'}
              onChange={() => handleChange('fitnessDeclaration', 'fitWithCondition')}
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">Fit with Condition</span>
          </label>
          <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-red-50 hover:bg-red-100">
            <input
              type="radio"
              checked={editableData.fitnessDeclaration === 'temporaryUnfit'}
              onChange={() => handleChange('fitnessDeclaration', 'temporaryUnfit')}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">Temporary Unfit</span>
          </label>
          <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-red-50 hover:bg-red-100">
            <input
              type="radio"
              checked={editableData.fitnessDeclaration === 'unfit'}
              onChange={() => handleChange('fitnessDeclaration', 'unfit')}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">UNFIT</span>
          </label>
        </div>
      </div>
      
      {/* Additional Information Section */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4 text-blue-800 border-b pb-2">Additional Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referred or Follow Up Actions</label>
            <input
              type="text"
              value={editableData.referral || ''}
              onChange={(e) => handleChange('referral', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review Date</label>
            <input
              type="date"
              value={formatDate(editableData.review_date || '')}
              onChange={(e) => handleChange('review_date', e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
            <textarea
              value={editableData.comments || ''}
              onChange={(e) => handleChange('comments', e.target.value)}
              rows={3}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            ></textarea>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Changes
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Certificate
        </button>
      </div>
    </div>
  );
};

export default EditableCertificate;