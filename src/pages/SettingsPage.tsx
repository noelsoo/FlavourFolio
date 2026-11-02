import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Globe, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const settingsItems = [
    {
      icon: User,
      title: 'Account',
      description: 'Manage your account details',
      action: () => {},
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Globe,
      title: 'Language',
      description: 'English (US)',
      action: () => {},
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: HelpCircle,
      title: 'Help',
      description: 'Get help and support',
      action: () => {},
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* User Info */}
      <div className="card mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Settings Items */}
      <div className="space-y-3 mb-8">
        {settingsItems.map((item) => (
          <button
            key={item.title}
            onClick={item.action}
            className="w-full card hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Log Out</span>
      </button>

      {/* App Version */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">Mise v1.0.0</p>
      </div>
    </div>
  );
};

export default SettingsPage;