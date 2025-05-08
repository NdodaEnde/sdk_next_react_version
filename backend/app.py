import os
import io
import time
import json
import tempfile
import base64
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import numpy as np
import cv2
from PIL import Image

# Load environment variables
load_dotenv()
api_key = os.getenv("VISION_AGENT_API_KEY")
if not api_key:
    print("Warning: VISION_AGENT_API_KEY not set in .env")

# Set SDK parallelism to maximum recommended values
os.environ["BATCH_SIZE"] = "20"  # Higher batch size for processing multiple documents
os.environ["MAX_WORKERS"] = "5"  # Max workers per document processing
os.environ["MAX_RETRIES"] = "100"  # Maximum retry attempts
os.environ["RETRY_LOGGING_STYLE"] = "inline_block"  # More compact logging

# --- Import the Agentic Doc SDK ---
from agentic_doc.parse import parse_documents
from agentic_doc.common import ChunkType

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching for development
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max upload


# Enable CORS for all origins, all routes
CORS(app, resources={r"/api/*": {
    "origins": "*",
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "max_age": 3600
}})

# Create upload folder if it doesn't exist
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"status": "API is working", "cors": "enabled"})

# Replace the process_document function in app.py with this improved version:

@app.route('/api/process', methods=['POST', 'OPTIONS'])
def process_document():
    # Handle preflight requests
    if request.method == 'OPTIONS':
        # Create a response with CORS headers
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    """Process uploaded PDF documents using agentic-doc SDK"""
    if 'files' not in request.files:
        response = jsonify({"error": "No files provided"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 400
    
    files = request.files.getlist('files')
    if not files or files[0].filename == '':
        response = jsonify({"error": "No files selected"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 400
    
    # Get the document type if provided
    document_type = request.form.get('documentType', 'Unknown')
    print(f"Document type: {document_type}")
    
    # Check for allowed file types (PDF, image files, DICOM)
    allowed_extensions = ['.pdf', '.png', '.jpg', '.jpeg', '.dcm', '.dicom']
    for file in files:
        file_ext = os.path.splitext(file.filename.lower())[1]
        if not file_ext in allowed_extensions:
            response = jsonify({"error": f"File {file.filename} has an unsupported format. Allowed formats: PDF, PNG, JPG, JPEG, DICOM"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 400
    
    # Log how many files we're processing
    print(f"Processing {len(files)} files: {', '.join([f.filename for f in files])}")
    
    # Start time tracking
    start_time = time.time()
    
    # Save files to temporary locations
    temp_paths = []
    filenames = []
    try:
        for file in files:
            # Get the file extension
            file_ext = os.path.splitext(file.filename.lower())[1]
            # Create a temporary file with the correct extension
            with tempfile.NamedTemporaryFile(suffix=file_ext, delete=False) as tmp:
                file.save(tmp.name)
                temp_paths.append(tmp.name)
                filenames.append(file.filename)
        
        # Process documents with agentic-doc SDK, with progress logging
        print(f"Starting document processing with agentic-doc SDK...")
        os.environ["BATCH_SIZE"] = str(min(20, max(1, len(files) * 4)))  # Scale batch size based on number of files
        results = parse_documents(temp_paths)
        print(f"Document processing complete")
        
        # Convert results to JSON-compatible format
        all_evidence = {}
        
        for i, parsed_doc in enumerate(results):
            if i >= len(filenames):
                print(f"Warning: More results than filenames, skipping result at index {i}")
                continue
                
            filename = filenames[i]
            print(f"Processing results for {filename}")
            
            # Map the parsed document to a page-based structure
            page_map = {}
            for chunk in parsed_doc.chunks:
                if chunk.chunk_type == "error":
                    print(f"Skipping error chunk in {filename}")
                    continue
                
                for grounding in chunk.grounding:
                    page_idx = grounding.page + 1  # convert to 1-based
                    
                    if page_idx not in page_map:
                        page_map[page_idx] = []
                    
                    try:
                        box = grounding.box
                        x, y = box.l, box.t
                        w, h = box.r - box.l, box.b - box.t
                        
                        page_map[page_idx].append({
                            "bboxes": [[x, y, w, h]],
                            "captions": [chunk.text],
                        })
                    except Exception as e:
                        print(f"Error processing grounding in {filename}, page {page_idx}: {e}")
            
            # Store in evidence structure
            for page_num, chunk_list in page_map.items():
                composite_key = f"{filename}:{page_num}"
                all_evidence[composite_key] = chunk_list
        
        # Processing complete - calculate time
        elapsed = time.time() - start_time
        minutes = int(elapsed // 60)
        seconds = int(elapsed % 60)
        
        print(f"Processing completed in {minutes}m {seconds}s, found evidence for {len(all_evidence)} pages")
        
        response = jsonify({
            "evidence": all_evidence,
            "processing_time": f"{minutes}m {seconds}s",
            "status": "success",
            "document_type": document_type,
            "files_processed": len(files),
            "total_pages_with_content": len(all_evidence)
        })
        
        # Explicitly set CORS headers for the response
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
        
    except Exception as e:
        print(f"Error processing documents: {e}")
        import traceback
        traceback.print_exc()
        response = jsonify({"error": str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500
    
    finally:
        # Clean up temp files
        for path in temp_paths:
            try:
                os.unlink(path)
            except Exception as e:
                print(f"Failed to remove temporary file {path}: {e}")

@app.route('/api/pdf-preview/<filename>', methods=['GET', 'OPTIONS'])
def pdf_preview(filename):
    # Handle preflight requests
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET')
        return response
        
    """Retrieve a PDF file from the uploads folder for preview"""
    try:
        response = send_file(os.path.join(UPLOAD_FOLDER, filename))
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        response = jsonify({"error": str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 404

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    # Handle preflight requests
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
        
    """Process chat messages using OpenAI"""
    try:
        data = request.json
        if not data or 'message' not in data or 'evidence' not in data:
            response = jsonify({"error": "Invalid request format"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 400
        
        user_query = data['message']
        evidence = data['evidence']
        
        # Use OpenAI to get answer
        from openai import OpenAI
        
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            response = jsonify({"error": "OPENAI_API_KEY not set in .env"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 500
        
        # Create the prompt
        prompt = f"""
        Use the following JSON evidence extracted from the uploaded PDF files, answer the following question based on that evidence.
        Please return your response in JSON format with three keys: 
        1. "answer": Your detailed answer to the question
        2. "reasoning": Your step-by-step reasoning process
        3. "best_chunks": A list of objects with:
           - "file"
           - "page"
           - "bboxes" (each bbox is [x, y, w, h])
           - "captions" (list of text snippets)
           - "reason"
           
        Question: {user_query}

        Evidence: {json.dumps(evidence)}
        """
        
        # Call OpenAI API
        client = OpenAI(api_key=openai_api_key)
        chat_response = client.chat.completions.create(
            model="gpt-4o",  # or "gpt-4", "gpt-3.5-turbo", etc.
            messages=[
                {
                    "role": "system",
                    "content": ("You are a helpful expert that analyses context deeply "
                                "and reasons through it without assuming anything.")
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,
        )
        
        raw = chat_response.choices[0].message.content.strip()
        # If the result is wrapped in ```json ... ``` fences, remove them:
        if raw.startswith("```"):
            lines = raw.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            raw = "\n".join(lines).strip()

        parsed = json.loads(raw)
        response = jsonify(parsed)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    except Exception as e:
        print(f"Error in chat: {e}")
        response = jsonify({
            "error": str(e),
            "answer": "Sorry, I could not retrieve an answer.",
            "reasoning": "An error occurred during processing.",
            "best_chunks": []
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

@app.route('/api/highlight-pdf', methods=['POST', 'OPTIONS'])
def highlight_pdf():
    # Handle preflight requests
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
        
    """Highlight areas on a PDF page"""
    try:
        data = request.json
        if not data or 'filename' not in data or 'page' not in data or 'highlights' not in data:
            response = jsonify({"error": "Missing required fields"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 400
        
        filename = data['filename']
        page_num = int(data['page'])
        highlights = data['highlights']
        
        # TODO: Implement PDF highlighting using PyMuPDF or similar
        # This is a placeholder that would return a base64 encoded PDF
        # with the highlights added
        
        response = jsonify({
            "status": "success",
            "message": "PDF highlighting not implemented yet"
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    except Exception as e:
        response = jsonify({"error": str(e)})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 500

if __name__ == '__main__':
    # Check for required API keys
    from werkzeug.serving import run_simple
    if not api_key:
        print("Warning: VISION_AGENT_API_KEY not set in .env")
    
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        print("Warning: OPENAI_API_KEY not set in .env")
    
    PORT = 8000  # Using port 8000 instead of 5000 to avoid conflicts with AirPlay
    print(f"Starting Flask server on http://localhost:{PORT}")
    print("CORS is enabled for all origins")
    print("Increasing timeout for long-running requests")
    # Run the app
    #app.run(debug=True, host='0.0.0.0', port=PORT)
    # Run the app with threaded=True for better handling of long requests
    app.run(debug=True, host='0.0.0.0', port=PORT, threaded=True)