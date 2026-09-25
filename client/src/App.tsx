import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ReconciliationProvider } from './context/ReconciliationContext';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ReconciliationProvider>
        <AppRoutes />
      </ReconciliationProvider>
    </BrowserRouter>
  );
};

export default App;
