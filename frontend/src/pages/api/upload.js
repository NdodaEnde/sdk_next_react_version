import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable body parsing, handle manually with formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form with formidable
    const form = new formidable.IncomingForm({
      multiples: true,
      keepExtensions: true,
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // Create form data for backend API
    const formData = new FormData();
    
    // Handle multiple files
    const fileArray = Array.isArray(files.files) ? files.files : [files.files];
    
    for (const file of fileArray) {
      const fileContent = fs.readFileSync(file.filepath);
      formData.append('files', new Blob([fileContent]), file.originalFilename);
    }

    // Forward to backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/upload`;
    
    const response = await axios.post(apiUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error uploading files:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to upload files',
      details: error.response?.data || {} 
    });
  }
}