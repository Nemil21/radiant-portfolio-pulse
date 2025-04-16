import React from 'react';
import Navigation from './Navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pb-8">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
