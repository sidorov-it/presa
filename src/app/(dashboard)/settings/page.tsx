'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FaUser, FaLock, FaGlobe, FaBell, FaPalette } from 'react-icons/fa';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, this would call your API to update the user's profile
    setIsSaving(false);
    setSaveSuccess(true);

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FaUser /> },
    { id: 'security', label: 'Security', icon: <FaLock /> },
    { id: 'appearance', label: 'Appearance', icon: <FaPalette /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'language', label: 'Language', icon: <FaGlobe /> },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Tabs sidebar */}
          <div className="w-full md:w-1/4 bg-gray-50 p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 w-full text-left rounded-md ${
                    activeTab === tab.id 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3 text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content area */}
          <div className="w-full md:w-3/4 p-6">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
                
                {saveSuccess && (
                  <div className="bg-green-50 text-green-800 p-3 rounded-md mb-4">
                    Your profile has been updated successfully.
                  </div>
                )}
                
                <form onSubmit={handleSaveProfile}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          isSaving ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-md font-medium">Change Password</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Update your password to maintain account security
                    </p>
                    <button className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900">
                      Change Password
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-md font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      Set Up Two-Factor Authentication
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Appearance Settings</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Customize the appearance of your presentation interface
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="border-2 border-blue-500 p-2 rounded-md text-center">
                        <div className="h-8 bg-blue-500 rounded mb-2"></div>
                        <span className="text-sm">Blue (Default)</span>
                      </div>
                      <div className="border-2 border-gray-200 p-2 rounded-md text-center">
                        <div className="h-8 bg-purple-500 rounded mb-2"></div>
                        <span className="text-sm">Purple</span>
                      </div>
                      <div className="border-2 border-gray-200 p-2 rounded-md text-center">
                        <div className="h-8 bg-green-500 rounded mb-2"></div>
                        <span className="text-sm">Green</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Appearance Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Control when and how you receive notifications
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">
                        Receive email notifications about your presentations
                      </p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="email-notifications"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <div>
                      <h3 className="text-md font-medium">Collaborative Edits</h3>
                      <p className="text-sm text-gray-500">
                        Notify me when someone edits my presentation
                      </p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="collaborative-edits"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Notification Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'language' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Language and Region</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Set your preferred language and regional settings
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                      Interface Language
                    </label>
                    <select
                      id="language"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      defaultValue="en"
                    >
                      <option value="en">English</option>
                      <option value="ru">Russian</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700">
                      Date Format
                    </label>
                    <select
                      id="dateFormat"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      defaultValue="mm-dd-yyyy"
                    >
                      <option value="mm-dd-yyyy">MM/DD/YYYY</option>
                      <option value="dd-mm-yyyy">DD/MM/YYYY</option>
                      <option value="yyyy-mm-dd">YYYY/MM/DD</option>
                    </select>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Language Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 