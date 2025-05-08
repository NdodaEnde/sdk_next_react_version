import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { pdfjs } from 'react-pdf';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Mock authentication state - will be replaced with real auth later
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate authentication check
    const checkAuth = () => {
      // For development, pretend we're logged in
      const mockUser = {
        id: 1,
        name: 'Dr. John Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        organization: {
          id: 1,
          name: 'Metro Health Services',
          type: 'service_provider'
        }
      };
      
      setUser(mockUser);
      setLoading(false);
    };
    
    // Simulate network delay
    const timer = setTimeout(checkAuth, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const login = (email, password) => {
    // Mock login
    const mockUser = {
      id: 1,
      name: 'Dr. John Doe',
      email: email,
      role: 'admin',
      organization: {
        id: 1,
        name: 'Metro Health Services',
        type: 'service_provider'
      }
    };
    
    setUser(mockUser);
    return Promise.resolve(mockUser);
  };

  const logout = () => {
    setUser(null);
    return Promise.resolve();
  };

  return { user, loading, login, logout };
};

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const { user, loading, login, logout } = useAuth();
  
  // Basic routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  
  useEffect(() => {
    // If not a public route and not authenticated, redirect to login
    if (!loading && !user && !publicRoutes.includes(router.pathname)) {
      router.push('/login');
    }
    
    // If authenticated and on a public route, redirect to dashboard
    if (!loading && user && publicRoutes.includes(router.pathname)) {
      router.push('/dashboard');
    }
  }, [loading, user, router.pathname]);
  
  // Show loading state
  if (loading && !publicRoutes.includes(router.pathname)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
            <p className="text-gray-500">Please wait while we set things up for you.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Create an auth context to pass down auth functions
  const authContextValue = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };
  
  // Add auth context provider when we implement context
  return (
    // Initially, we'll just pass auth props directly
    // Later will replace with proper context
    <Component {...pageProps} auth={authContextValue} />
  );
}

export default MyApp;