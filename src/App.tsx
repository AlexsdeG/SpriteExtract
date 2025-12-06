import React from 'react';
import { Toaster } from 'sonner';
import MainLayout from './components/layout/MainLayout';

const App: React.FC = () => {
  return (
    <>
      <MainLayout />
      <Toaster position="bottom-right" theme="dark" />
    </>
  );
};

export default App;