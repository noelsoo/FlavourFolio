import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, HelpCircle, Star, MessageCircle, ChefHat, Calendar, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MorePage = () => {
  const { user } = useAuth();

  const menuItems = [
    {
      icon: Settings,
      title: 'Settings',
      description: 'Account and app preferences',
      to: '/settings',
      color: 'bg-gray-100 text-gray-600'
    },
    {
      icon: HelpCircle,
      title: 'Help & Support',
      description: 'Get help and contact support',
      to: '#',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Star,
      title: 'Rate Mise',
      description: 'Leave a review in the app store',
      to: '#',
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      icon: MessageCircle,
      title: 'Send Feedback',
      description: 'Help us improve Mise',
      to: '#',
      color: 'bg-green-100 text-green-600'
    }
  ];

  const quickStats = [
    {
      icon: BookOpen,
      label: 'Recipes',
      value: '12',
      color: 'text-primary-600'
    },
    {
      icon: ChefHat,
      label: 'Cookbooks',
      value: '3',
      color: 'text-secondary-600'
    },
    {
      icon: Calendar,
      label: 'Meals Planned',
      value: '8',
      color: 'text-accent-600'
    }
  ];

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* User Profile */}
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

      {/* Quick Stats */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Mise</h3>
        <div className="grid grid-cols-3 gap-4">
          {quickStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex justify-center mb-2">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-3">
        {menuItems.map((item) => (
          <Link key={item.title} to={item.to}>
            <div className="card hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* App Info */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500 mb-2">Mise v1.0.0</p>
        <p className="text-xs text-gray-400">
          Made with ❤️ for home cooks everywhere
        </p>
      </div>
    </div>
  );
};

export default MorePage;