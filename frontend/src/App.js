import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// Page components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IntegrationsList from './pages/IntegrationsList';
import IntegrationDetail from './pages/IntegrationDetail';
import CreateIntegration from './pages/CreateIntegration';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import ChatClient from './pages/ChatClient';
import LLMChatClient from './pages/LLMChatClient';
import NotFound from './pages/NotFound';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';

// Services
import { authService } from './services/api';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Header />
        <Container className="flex-grow-1 py-4">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/integrations" 
              element={
                <PrivateRoute>
                  <IntegrationsList />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/integrations/:id" 
              element={
                <PrivateRoute>
                  <IntegrationDetail />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/integrations/create" 
              element={
                <PrivateRoute>
                  <CreateIntegration />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/chat" 
              element={
                <PrivateRoute>
                  <ChatClient />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/ai-chat" 
              element={
                <PrivateRoute>
                  <LLMChatClient />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/users" 
              element={
                <PrivateRoute requiredRole="admin">
                  <UserManagement />
                </PrivateRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 