'use client';

import { useState } from 'react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onPageChange: (page: string) => void;
  currentPage: string;
  onCreateOrder?: () => void;
}

export default function Sidebar({ isCollapsed, onToggle, onPageChange, currentPage, onCreateOrder }: SidebarProps) {
  const [showSubmenu, setShowSubmenu] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2v6H8V5z" />
        </svg>
      )
    },
    {
      id: 'orders',
      label: 'Siparişler',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
        </svg>
      )
    },
          {
        id: 'customers',
        label: 'Müşteriler',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
          {
        id: 'reports',
        label: 'Raporlar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
          {
        id: 'settings',
        label: 'Ayarlar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      hasSubmenu: true
    }
  ];

  return (
    <div className={`bg-blue-900 text-white flex flex-col h-full overflow-hidden transition-all duration-500 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'} lg:relative fixed lg:static z-50 relative`}>
      {/* Header with Toggle */}
      <div className="p-4 lg:p-6 border-b border-blue-800 flex items-center justify-between min-h-[60px] lg:min-h-[80px]">
        {/* Brand Name - Only show when expanded */}
        <div className={`transition-all duration-500 ease-in-out ${isCollapsed ? 'opacity-0 scale-95 w-0 overflow-hidden' : 'opacity-100 scale-100 w-auto'}`}>
          <span className="text-lg font-semibold whitespace-nowrap">cicekgo.net</span>
        </div>
        
        {/* Toggle Button - Desktop Only */}
        <button
          onClick={onToggle}
          className={`hidden lg:block p-2 rounded-lg bg-blue-800 hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`}
        >
          <svg className={`w-4 h-4 transition-transform duration-500 ease-in-out ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>


      </div>

      

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-4 space-y-1 lg:space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => {
                if (item.hasSubmenu) {
                  setShowSubmenu(!showSubmenu);
                } else {
                  onPageChange(item.id);
                }
              }}
              className={`w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-4 py-2 lg:py-3 rounded-lg text-left transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
                currentPage === item.id
                  ? 'bg-blue-700 text-white shadow-lg border-l-4 border-white rounded-l-none'
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              <div className={`transition-all duration-500 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                <span className="flex-1 whitespace-nowrap text-sm lg:text-base">{item.label}</span>
                {item.hasSubmenu && (
                  <svg 
                    className={`w-4 h-4 transition-transform duration-300 ease-in-out ${showSubmenu ? 'rotate-90' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>
            
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${!isCollapsed && item.hasSubmenu && showSubmenu ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="ml-4 lg:ml-8 mt-2 space-y-1">
                <button className="w-full flex items-center gap-2 px-2 lg:px-4 py-1 lg:py-2 text-xs lg:text-sm text-blue-200 hover:bg-blue-800 rounded transition-all duration-200 ease-in-out transform hover:scale-[1.02]">
                  <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="whitespace-nowrap">Paylaş</span>
                </button>
                <button className="w-full flex items-center gap-2 px-2 lg:px-4 py-1 lg:py-2 text-xs lg:text-sm text-blue-200 hover:bg-blue-800 rounded transition-all duration-200 ease-in-out transform hover:scale-[1.02]">
                  <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="whitespace-nowrap">Kopyala</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section - Mobile Only */}
      <div className="lg:hidden p-2 lg:p-4 border-t border-blue-800">
        <div className="bg-blue-800 rounded-lg p-3">
          <h3 className="text-xs font-medium text-blue-200 mb-2">Hızlı Erişim</h3>
          <div className="flex gap-2">
            <button 
              onClick={onCreateOrder}
              className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 px-2 rounded transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="whitespace-nowrap">Yeni Sipariş</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 px-2 rounded transition-all duration-200 ease-in-out transform hover:scale-105">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="whitespace-nowrap">Yeni Müşteri</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
