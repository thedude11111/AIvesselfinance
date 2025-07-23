import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from './config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import SignInPage from './components/SignInPage';
import MainApp from './components/MainApp';
import './App.css';

/**
 * Main Application Component
 * Handles authentication state and routing between SignIn and MainApp
 */
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await signInWithPopup(auth, googleProvider);
      
      // Send ID token to backend for verification
      const idToken = await result.user.getIdToken();
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();
      console.log('Authentication successful:', data);
      
    } catch (error) {
      console.error('Sign-in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Sign-out error:', error);
      setError('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <SignInPage 
        onSignIn={handleSignIn} 
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <MainApp 
      user={user} 
      onSignOut={handleSignOut}
    />
  );
}

export default App;