'use client';

import { useState, useEffect } from 'react';
import ProfileModal from './ProfileModal';

interface HeaderProps {
  user: any;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [remainingDays, setRemainingDays] = useState(0);

  // Kullanıcı adından baş harfleri al
  const getUserInitials = (userName: string) => {
    if (!userName) return 'U';
    const parts = userName.split('.');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return userName.charAt(0).toUpperCase();
  };

  // Tenant bilgilerini localStorage'dan al
  useEffect(() => {
    const storedTenantInfo = localStorage.getItem('tenantInfo');
    if (storedTenantInfo) {
      const info = JSON.parse(storedTenantInfo);
      setTenantInfo(info);
      
      // Kalan günleri hesapla
      const endDate = new Date(info.lkEnd);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setRemainingDays(Math.max(0, diffDays));
    }
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between">


        {/* Logo/Brand */}
        <div className="flex items-center">
          <img 
            src="/cicekgo-logo.png" 
            alt="ÇiçekGo Logo" 
            className="h-8 w-auto"
          />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* User Info */}
          <span className="text-sm text-gray-600 hidden sm:block">
            Hoş geldin, {tenantInfo?.name || user?.userName}
          </span>

          {/* Notifications */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.userName ? getUserInitials(user.userName) : 'U'}
              </div>
              <span className="hidden lg:block text-sm font-medium text-gray-900">
                {user?.userName || 'Kullanıcı'}
              </span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profil
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

            {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        tenantInfo={tenantInfo}
        remainingDays={remainingDays}
      />
    </header>
  );
}
