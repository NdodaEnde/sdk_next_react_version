from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)

# Enable CORS for all origins, all routes
CORS(app)

# Create upload folder if it doesn't exist
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"status": "API is working", "cors": "enabled"})

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

    # Check if files were uploaded
    if 'files' not in request.files:
        response = jsonify({"error": "No files provided"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 400

    # Print the received files for debugging
    files = request.files.getlist('files')
    print(f"Received {len(files)} files:")
    for file in files:
        print(f" - {file.filename}")

    # Simple success response
    response = jsonify({
        "evidence": {"test:1": [{"bboxes": [[0.1, 0.1, 0.2, 0.2]], "captions": ["Test document content"]}]},
        "processing_time": "0m 1s",
        "status": "success"
    })
    
    # Explicitly set CORS headers
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ == '__main__':
    PORT = 8000  # Changed port from 5000 to 8000
    print(f"Starting Test Flask Server on http://localhost:{PORT}")
    print("CORS is enabled for all origins")
    app.run(debug=True, host='0.0.0.0', port=PORT)