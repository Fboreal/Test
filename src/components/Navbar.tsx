import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, LogOut, LogIn, Plus, Settings } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Get user initial from email
  const getUserInitial = () => {
    if (!user || !user.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setSettingsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-orange-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Package className="h-6 w-6" />
            <span className="text-xl font-bold">Etandstock</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="relative" ref={settingsDropdownRef}>
                  <button 
                    onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                    className="p-2 rounded-full hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  
                  {settingsDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <Link 
                        to="/categories"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setSettingsDropdownOpen(false)}
                      >
                        Gérer les catégories
                      </Link>
                      <Link 
                        to="/suppliers"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setSettingsDropdownOpen(false)}
                      >
                        Gérer les fournisseurs
                      </Link>
                      <Link 
                        to="/agencies"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setSettingsDropdownOpen(false)}
                      >
                        Gérer les agences
                      </Link>
                    </div>
                  )}
                </div>
                
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-9 h-9 rounded-full bg-orange-700 flex items-center justify-center hover:bg-orange-800 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <span className="font-medium">{getUserInitial()}</span>
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        {user.email}
                      </div>
                      <button 
                        onClick={handleSignOut}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2 text-gray-500" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center space-x-1 hover:text-orange-200 transition-colors"
              >
                <LogIn className="h-5 w-5" />
                <span>Connexion / Inscription</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;