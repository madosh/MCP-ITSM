import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Layout components
import Layout from './components/Layout';

// Authentication components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProtectedRoute from './components/ProtectedRoute';

// Main pages
import Dashboard from './pages/Dashboard';

// Context management pages
import Contexts from './pages/contexts/Contexts';
import ContextDetail from './pages/contexts/ContextDetail';
import CreateContext from './pages/contexts/CreateContext';

// Integration pages
import Integrations from './pages/integrations/Integrations';
import IntegrationDetail from './pages/integrations/IntegrationDetail';
import CreateIntegration from './pages/integrations/CreateIntegration';

// User management pages
import Users from './pages/users/Users';
import UserDetail from './pages/users/UserDetail';

// Other pages
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        Loading...
      </Box>
    );
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Contexts */}
          <Route path="/contexts" element={<Contexts />} />
          <Route path="/contexts/create" element={<CreateContext />} />
          <Route path="/contexts/:id" element={<ContextDetail />} />
          
          {/* Integrations */}
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/integrations/create" element={<CreateIntegration />} />
          <Route path="/integrations/:id" element={<IntegrationDetail />} />
          
          {/* Users */}
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id" element={<UserDetail />} />
        </Route>
      </Route>
      
      {/* Not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App; 