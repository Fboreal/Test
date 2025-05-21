import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ArticleForm from './pages/ArticleForm';
import ArticleDetails from './pages/ArticleDetails';
import Navbar from './components/Navbar';
import CategoriesManager from './pages/CategoriesManager';
import SuppliersManager from './pages/SuppliersManager';
import AgenciesManager from './pages/AgenciesManager';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/articles/new" 
                element={
                  <ProtectedRoute>
                    <ArticleForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/articles/edit/:id" 
                element={
                  <ProtectedRoute>
                    <ArticleForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/articles/:id" 
                element={
                  <ProtectedRoute>
                    <ArticleDetails />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/categories" 
                element={
                  <ProtectedRoute>
                    <CategoriesManager />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/suppliers" 
                element={
                  <ProtectedRoute>
                    <SuppliersManager />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/agencies" 
                element={
                  <ProtectedRoute>
                    <AgenciesManager />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;