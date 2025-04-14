
import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';

const AuthGuard: React.FC = () => {
  const { isAuthenticated, loading } = useFinance();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, loading, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-finance-teal animate-pulse"></div>
          <p className="mt-4 text-lg font-medium">Loading your portfolio...</p>
        </div>
      </div>
    );
  }
  
  // If not loading and authenticated, render the protected content
  return isAuthenticated ? <Outlet /> : null;
};

export default AuthGuard;
