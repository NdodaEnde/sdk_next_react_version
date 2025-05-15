import React, { useMemo } from 'react';

/**
 * PasswordStrengthMeter Component
 * 
 * A component that displays a password strength meter and validation requirements.
 * 
 * @param {Object} props
 * @param {string} props.password - The password to validate
 * @param {boolean} props.showValidation - Whether to show the validation requirements
 */
const PasswordStrengthMeter = ({ password, showValidation = true }) => {
  // Calculate password strength
  const passwordChecks = useMemo(() => {
    return {
      // Has at least 8 characters
      minLength: password.length >= 8,
      // Has at least one uppercase letter
      hasUppercase: /[A-Z]/.test(password),
      // Has at least one lowercase letter
      hasLowercase: /[a-z]/.test(password),
      // Has at least one number
      hasNumber: /\d/.test(password),
      // Has at least one special character
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  // Calculate strength score (0-4)
  const strengthScore = useMemo(() => {
    const { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecial } = passwordChecks;
    
    let score = 0;
    if (minLength) score += 1;
    if (hasUppercase) score += 1;
    if (hasLowercase) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;
    
    // Additional bonus for a longer password
    if (password.length > 12) score += 1;
    
    return Math.min(4, score); // Cap at 4
  }, [password, passwordChecks]);

  // Color and label based on strength
  const strengthInfo = useMemo(() => {
    if (!password) {
      return { color: 'bg-gray-200', label: 'Password strength' };
    }
    
    switch (strengthScore) {
      case 0:
      case 1:
        return { color: 'bg-red-500', label: 'Very Weak' };
      case 2:
        return { color: 'bg-orange-500', label: 'Weak' };
      case 3:
        return { color: 'bg-yellow-500', label: 'Moderate' };
      case 4:
        return { color: 'bg-green-500', label: 'Strong' };
      default:
        return { color: 'bg-gray-200', label: 'Password strength' };
    }
  }, [password, strengthScore]);

  return (
    <div className="space-y-2">
      {/* Strength meter */}
      <div className="w-full">
        <div className="h-2 w-full bg-gray-200 rounded-full">
          {password && (
            <div 
              className={`h-2 rounded-full ${strengthInfo.color}`} 
              style={{ width: `${(strengthScore / 4) * 100}%` }}
            ></div>
          )}
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-xs text-gray-500">{strengthInfo.label}</span>
        </div>
      </div>
      
      {/* Validation requirements */}
      {showValidation && password && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className={`flex items-center ${passwordChecks.minLength ? 'text-green-600' : 'text-gray-500'}`}>
            {passwordChecks.minLength ? (
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            At least 8 characters
          </div>
          
          <div className={`flex items-center ${passwordChecks.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
            {passwordChecks.hasUppercase ? (
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            Uppercase letter
          </div>
          
          <div className={`flex items-center ${passwordChecks.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
            {passwordChecks.hasLowercase ? (
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            Lowercase letter
          </div>
          
          <div className={`flex items-center ${passwordChecks.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
            {passwordChecks.hasNumber ? (
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            Number
          </div>
          
          <div className={`flex items-center ${passwordChecks.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
            {passwordChecks.hasSpecial ? (
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            Special character
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;