import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, evidence } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Forward request to backend API
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/chat`;
    
    const response = await axios.post(apiUrl, {
      message,
      evidence
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to process chat request',
      details: error.response?.data || {} 
    });
  }
}