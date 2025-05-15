"""
Certificate Data Extractor for medical certificates.
This Python module implements the extraction logic that was previously in JavaScript.
It parses evidence captions from OCR output to extract structured data for certificates.
"""

import re
import json
import datetime

def extract_certificate_data(evidence):
    """
    Extract certificate data from evidence captions
    Args:
        evidence: Dictionary of evidence captions keyed by page
    
    Returns:
        Dictionary of structured certificate data
    """
    print("Starting certificate data extraction...")
    
    # Initialize structured data
    structured_data = {
        "name": "",
        "id_number": "",
        "company": "",
        "exam_date": "",
        "expiry_date": "",
        "job": "",
        "examinationType": "",
        "medicalExams": {
            "blood": False,
            "vision": False,
            "depthVision": False,
            "nightVision": False,
            "hearing": False,
            "heights": False,
            "lung": False,
            "xray": False,
            "drugScreen": False
        },
        "medicalResults": {},
        "restrictions": {
            "heights": False,
            "dust": False,
            "motorized": False,
            "hearingProtection": False,
            "confinedSpaces": False,
            "chemical": False,
            "spectacles": False,
            "treatment": False
        },
        "fitnessDeclaration": "",
        "referral": "",
        "review_date": "",
        "comments": ""
    }
    
    # Collect all captions from all pages
    all_captions = []
    for page_key, evidence_list in evidence.items():
        for ev in evidence_list:
            if 'captions' in ev:
                all_captions.extend(ev['captions'])
    
    # Categorize captions by type
    captions_by_type = {
        "name": [],
        "id": [],
        "company": [],
        "date": [],
        "expiry": [],
        "job": [],
        "test": [],
        "fitness": [],
        "restriction": []
    }
    
    # Pattern matchers for different types of information
    name_patterns = [
        r"(?:name|patient|employee|surname)[\s:]+([A-Za-z\s.'-]+)",
        r"initials?\s*(?:&|and)\s*surname[\s:]+([A-Za-z\s.'-]+)"
    ]
    
    id_patterns = [
        r"(?:id|identity|identification|employee)[\s:\.#]+(\d[\d\s-]+\d)",
        r"id\s*(?:no|number|#)[\s:\.]+(\d[\d\s-]+\d)"
    ]
    
    company_patterns = [
        r"(?:company|employer|organization)[\s:]+([A-Za-z0-9\s.'-]+)",
        r"company\s*name[\s:]+([A-Za-z0-9\s.'-]+)"
    ]
    
    date_patterns = [
        r"(?:date|examination|exam date|test date)[\s:]+(\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4})",
        r"date\s*of\s*examination[\s:]+(\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4})"
    ]
    
    expiry_patterns = [
        r"(?:expiry|expiration|valid until|expires)[\s:]+(\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4})",
        r"expiry\s*date[\s:]+(\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4})"
    ]
    
    job_patterns = [
        r"(?:job|occupation|position|title)[\s:]+([A-Za-z0-9\s.'-]+)",
        r"job\s*title[\s:]+([A-Za-z0-9\s.'-]+)"
    ]
    
    # Categorize captions
    for caption in all_captions:
        if not caption or len(caption) < 3:
            continue
            
        caption_lower = caption.lower()
        
        # Check for name
        for pattern in name_patterns:
            matches = re.search(pattern, caption_lower)
            if matches:
                captions_by_type["name"].append(caption)
                break
                
        # Check for ID
        for pattern in id_patterns:
            matches = re.search(pattern, caption_lower)
            if matches:
                captions_by_type["id"].append(caption)
                break
                
        # Check for company
        for pattern in company_patterns:
            matches = re.search(pattern, caption_lower)
            if matches:
                captions_by_type["company"].append(caption)
                break
                
        # Check for date
        for pattern in date_patterns:
            matches = re.search(pattern, caption_lower)
            if matches:
                captions_by_type["date"].append(caption)
                break
                
        # Check for expiry
        for pattern in expiry_patterns:
            matches = re.search(pattern, caption_lower)
            if matches:
                captions_by_type["expiry"].append(caption)
                break
                
        # Check for job title
        for pattern in job_patterns:
            matches = re.search(pattern, caption_lower)
            if matches:
                captions_by_type["job"].append(caption)
                break
        
        # Check for medical tests
        if any(term in caption_lower for term in ["blood", "vision", "hearing", "lung", "xray", "screen", "test"]):
            captions_by_type["test"].append(caption)
            
        # Check for fitness declaration
        if any(term in caption_lower for term in ["fit", "unfit", "declaration", "fitness"]):
            captions_by_type["fitness"].append(caption)
            
        # Check for restrictions
        if any(term in caption_lower for term in ["restriction", "prohibited", "limited", "confined", "spectacles"]):
            captions_by_type["restriction"].append(caption)
    
    # Extract data from categorized captions
    
    # Extract name
    for caption in captions_by_type["name"]:
        caption_lower = caption.lower()
        for pattern in name_patterns:
            matches = re.search(pattern, caption_lower)
            if matches:
                name = matches.group(1).strip()
                if len(name) > 1:  # Avoid single character names (likely errors)
                    structured_data["name"] = name.title()  # Convert to title case
                    break
    
    # Extract ID
    for caption in captions_by_type["id"]:
        caption_lower = caption.lower()
        for pattern in id_patterns:
            matches = re.search(pattern, caption_lower)
            if matches:
                id_number = matches.group(1).strip()
                # Remove common separators and spaces in ID numbers
                id_number = re.sub(r'[\s-]', '', id_number)
                if len(id_number) >= 6:  # Avoid very short IDs (likely errors)
                    structured_data["id_number"] = id_number
                    break
    
    # Extract company
    for caption in captions_by_type["company"]:
        caption_lower = caption.lower()
        for pattern in company_patterns:
            matches = re.search(pattern, caption_lower)
            if matches:
                company = matches.group(1).strip()
                if len(company) > 1:
                    structured_data["company"] = company.title()  # Convert to title case
                    break
    
    # Extract examination date
    for caption in captions_by_type["date"]:
        caption_lower = caption.lower()
        for pattern in date_patterns:
            matches = re.search(pattern, caption_lower)
            if matches:
                date_str = matches.group(1).strip()
                # Normalize date format to YYYY-MM-DD
                try:
                    # Try different date formats
                    for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%m-%d-%Y', '%Y/%m/%d', '%d/%m/%Y', '%m/%d/%Y']:
                        try:
                            date_obj = datetime.datetime.strptime(date_str, fmt)
                            structured_data["exam_date"] = date_obj.strftime('%Y-%m-%d')
                            break
                        except ValueError:
                            continue
                except Exception:
                    # If date parsing fails, just use the string as is
                    structured_data["exam_date"] = date_str
                break
    
    # Extract expiry date
    for caption in captions_by_type["expiry"]:
        caption_lower = caption.lower()
        for pattern in expiry_patterns:
            matches = re.search(pattern, caption_lower)
            if matches:
                date_str = matches.group(1).strip()
                # Normalize date format
                try:
                    # Try different date formats
                    for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%m-%d-%Y', '%Y/%m/%d', '%d/%m/%Y', '%m/%d/%Y']:
                        try:
                            date_obj = datetime.datetime.strptime(date_str, fmt)
                            structured_data["expiry_date"] = date_obj.strftime('%Y-%m-%d')
                            break
                        except ValueError:
                            continue
                except Exception:
                    # If date parsing fails, just use the string as is
                    structured_data["expiry_date"] = date_str
                break
    
    # Extract job title
    for caption in captions_by_type["job"]:
        caption_lower = caption.lower()
        for pattern in job_patterns:
            matches = re.search(pattern, caption_lower)
            if matches:
                job = matches.group(1).strip()
                if len(job) > 1:
                    structured_data["job"] = job.title()  # Convert to title case
                    break
    
    # Extract examination type
    examination_types = ["pre-employment", "periodical", "exit"]
    for caption in all_captions:
        caption_lower = caption.lower()
        for exam_type in examination_types:
            if exam_type in caption_lower:
                structured_data["examinationType"] = exam_type
                break
    
    # Default to periodical if no type is found
    if not structured_data["examinationType"]:
        structured_data["examinationType"] = "periodical"
    
    # Extract medical tests
    for caption in captions_by_type["test"]:
        caption_lower = caption.lower()
        
        # Check for blood tests
        if any(term in caption_lower for term in ["blood", "bloods", "blood test"]):
            structured_data["medicalExams"]["blood"] = True
            # Try to extract results
            result_match = re.search(r"blood\s*(?:test)?[\s:]+([^\n]+)", caption_lower)
            if result_match:
                structured_data["medicalResults"]["blood"] = result_match.group(1).strip()
        
        # Check for vision tests
        if any(term in caption_lower for term in ["vision", "visual", "sight", "eye"]):
            structured_data["medicalExams"]["vision"] = True
            # Try to extract results
            result_match = re.search(r"vision[\s:]+([^\n]+)", caption_lower)
            if result_match:
                structured_data["medicalResults"]["vision"] = result_match.group(1).strip()
        
        # Check for hearing tests
        if any(term in caption_lower for term in ["hearing", "audiometry", "audio"]):
            structured_data["medicalExams"]["hearing"] = True
            # Try to extract results
            result_match = re.search(r"hearing[\s:]+([^\n]+)", caption_lower)
            if result_match:
                structured_data["medicalResults"]["hearing"] = result_match.group(1).strip()
        
        # Check for lung tests
        if any(term in caption_lower for term in ["lung", "pulmonary", "spirometry"]):
            structured_data["medicalExams"]["lung"] = True
            # Try to extract results
            result_match = re.search(r"lung[\s:]+([^\n]+)", caption_lower)
            if result_match:
                structured_data["medicalResults"]["lung"] = result_match.group(1).strip()
        
        # Check for X-ray tests
        if any(term in caption_lower for term in ["xray", "x-ray", "radiography"]):
            structured_data["medicalExams"]["xray"] = True
            # Try to extract results
            result_match = re.search(r"xray[\s:]+([^\n]+)", caption_lower)
            if result_match:
                structured_data["medicalResults"]["xray"] = result_match.group(1).strip()
        
        # Check for drug screen tests
        if any(term in caption_lower for term in ["drug", "substance", "toxicology"]):
            structured_data["medicalExams"]["drugScreen"] = True
            # Try to extract results
            result_match = re.search(r"drug[\s:]+([^\n]+)", caption_lower)
            if result_match:
                structured_data["medicalResults"]["drugScreen"] = result_match.group(1).strip()
    
    # Extract fitness declaration
    for caption in captions_by_type["fitness"]:
        caption_lower = caption.lower()
        
        # Check for fitness status
        if "fit" in caption_lower and "unfit" not in caption_lower:
            # Check for conditions/restrictions
            if any(term in caption_lower for term in ["restriction", "condition"]):
                if "restriction" in caption_lower:
                    structured_data["fitnessDeclaration"] = "fitWithRestriction"
                else:
                    structured_data["fitnessDeclaration"] = "fitWithCondition"
            else:
                structured_data["fitnessDeclaration"] = "fit"
        elif "unfit" in caption_lower:
            if "temporary" in caption_lower:
                structured_data["fitnessDeclaration"] = "temporaryUnfit"
            else:
                structured_data["fitnessDeclaration"] = "unfit"
    
    # Default to fit if nothing found
    if not structured_data["fitnessDeclaration"]:
        structured_data["fitnessDeclaration"] = "fit"
    
    # Extract restrictions
    for caption in captions_by_type["restriction"]:
        caption_lower = caption.lower()
        
        # Check for specific restrictions
        if any(term in caption_lower for term in ["height", "elevation"]):
            structured_data["restrictions"]["heights"] = True
        
        if any(term in caption_lower for term in ["dust", "particulate"]):
            structured_data["restrictions"]["dust"] = True
        
        if any(term in caption_lower for term in ["motor", "vehicle", "equipment", "machinery"]):
            structured_data["restrictions"]["motorized"] = True
        
        if any(term in caption_lower for term in ["hearing protection", "ear protection"]):
            structured_data["restrictions"]["hearingProtection"] = True
        
        if any(term in caption_lower for term in ["confined", "space", "enclosed"]):
            structured_data["restrictions"]["confinedSpaces"] = True
        
        if any(term in caption_lower for term in ["chemical", "toxin", "hazardous"]):
            structured_data["restrictions"]["chemical"] = True
        
        if any(term in caption_lower for term in ["spectacle", "glasses", "vision correction"]):
            structured_data["restrictions"]["spectacles"] = True
        
        if any(term in caption_lower for term in ["treatment", "medication", "therapy"]):
            structured_data["restrictions"]["treatment"] = True
    
    # Look for comments
    comment_patterns = [
        r"comment[s]?[\s:]+([^\n]+)",
        r"note[s]?[\s:]+([^\n]+)",
        r"additional information[\s:]+([^\n]+)"
    ]
    
    for caption in all_captions:
        caption_lower = caption.lower()
        for pattern in comment_patterns:
            matches = re.search(pattern, caption_lower)
            if matches:
                structured_data["comments"] = matches.group(1).strip()
                break
    
    print(f"Certificate extraction complete, found {len(structured_data.keys())} data fields")
    return structured_data

# Example usage
if __name__ == "__main__":
    # Test with some sample evidence
    sample_evidence = {
        "page1:1": [
            {"captions": ["Certificate of Fitness", "Patient Name: John Doe", "ID No: 123456789"]},
            {"captions": ["Company Name: ABC Corporation", "Date of Examination: 2025-01-15"]}
        ],
        "page1:2": [
            {"captions": ["Expiry Date: 2026-01-15", "Job Title: Engineer", "FIT"]}
        ]
    }
    
    result = extract_certificate_data(sample_evidence)
    print(json.dumps(result, indent=2))