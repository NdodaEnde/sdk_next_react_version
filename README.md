# Document Processing Platform

A modern web application for document processing and analysis, built with Next.js and Flask.

## Features

- PDF document upload and processing
- Advanced document viewing with highlighted evidence
- Interactive chat interface for querying document content
- Document management with search and filter capabilities
- Card and list view options for document browsing
- Document status tracking and review workflow

## Project Structure

The project is divided into two main parts:

### Frontend (Next.js)

The frontend is built with Next.js and React, located in the `frontend` directory.

- `src/components`: Reusable UI components
- `src/pages`: Next.js pages and API routes
- `src/styles`: Global styles

### Backend (Flask)

The backend is built with Flask, located in the `backend` directory.

- `app.py`: Main Flask application
- `requirements.txt`: Python dependencies

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Environment Variables

Make sure to set the following environment variables:

### Backend (.env)
```
VISION_AGENT_API_KEY=your_vision_agent_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request