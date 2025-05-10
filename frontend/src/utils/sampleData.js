/**
 * Sample data for testing the certificate template population feature
 */

// Mock evidence data that mimics what would be received from the OCR API
export const mockEvidenceData = {
  "sample_certificate.pdf:1": [
    {
      "captions": [
        "CERTIFICATE OF FITNESS",
        "BLUECOLLAR OCCUPATIONAL HEALTH",
        "Dr. MJ Mputhi / Practice No: 0404160 / Sr. Sibongile Mahlangu / Practice No: 999 088 0000 8177 91",
        "Initials & Surname: J.R. Doe",
        "ID NO: 8501235678091",
        "Company Name: SurgiTech Solutions",
        "Date of Examination: 2023-05-15",
        "Expiry Date: 2024-05-15",
        "Job Title: Medical Technician"
      ]
    },
    {
      "captions": [
        "PRE-EMPLOYMENT ✓",
        "PERIODICAL",
        "EXIT"
      ]
    },
    {
      "captions": [
        "MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS",
        "BLOODS | Done: ✓ | Results: Normal",
        "FAR, NEAR VISION | Done: ✓ | Results: 20/20",
        "SIDE & DEPTH | Done: ✓ | Results: Normal",
        "NIGHT VISION | Done: | Results:",
        "Hearing | Done: ✓ | Results: Normal",
        "Working at Heights | Done: ✓ | Results: Pass",
        "Lung Function | Done: ✓ | Results: 95%",
        "X-Ray | Done: ✓ | Results: Clear",
        "Drug Screen | Done: ✓ | Results: Negative"
      ]
    },
    {
      "captions": [
        "Referred or follow up actions: None required at this time",
        "Review Date: 2023-11-15"
      ]
    },
    {
      "captions": [
        "Restrictions:",
        "Heights ✓",
        "Dust Exposure ✓",
        "Motorized Equipment",
        "Wear Hearing Protection ✓",
        "Confined Spaces ✓",
        "Chemical Exposure",
        "Wear Spectacles",
        "Remain on Treatment for Chronic Conditions"
      ]
    },
    {
      "captions": [
        "Medical Fitness Declaration",
        "FIT ✓",
        "Fit with Restriction",
        "Fit with Condition",
        "Temporary Unfit",
        "UNFIT"
      ]
    },
    {
      "captions": [
        "Comments: Patient is fit for duty with the listed restrictions. Follow-up examination recommended in 6 months."
      ]
    }
  ]
};

// Sample populated certificate data ready for the template
export const sampleCertificateData = {
  name: "J.R. Doe",
  id_number: "8501235678091",
  company: "SurgiTech Solutions",
  exam_date: "2023-05-15",
  expiry_date: "2024-05-15",
  job: "Medical Technician",
  
  examination_type: "pre-employment",
  
  medical_exams: {
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
  
  medical_results: {
    blood: "Normal",
    vision: "20/20",
    depthVision: "Normal",
    hearing: "Normal",
    heights: "Pass",
    lung: "95%",
    xray: "Clear",
    drugScreen: "Negative"
  },
  
  fitness_declaration: "fit",
  
  restrictions: {
    heights: true,
    dust: true,
    motorized: false,
    hearingProtection: true,
    confinedSpaces: true,
    chemical: false,
    spectacles: false,
    treatment: false
  },
  
  referral: "None required at this time",
  review_date: "2023-11-15",
  comments: "Patient is fit for duty with the listed restrictions. Follow-up examination recommended in 6 months."
};