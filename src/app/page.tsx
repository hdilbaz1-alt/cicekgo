'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import OrdersPage from '@/components/OrdersPage';

import { authService } from '@/services/authService';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        router.push('/login');
      }
    }
  }, [router]);

  const handleLogout = () => {
    authService.clearToken();
    router.push('/login');
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    // Mobile sidebar'ı kapat
    setMobileSidebarOpen(false);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    // Mobile'da sidebar kapalıysa aç
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  };

  const handleMobileSidebarToggle = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Dashboard
                </h2>
                <p className="text-gray-600 mb-8">
                  Hoş geldiniz! Bu dashboard sayfasıdır.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Özellikler:
                  </h3>
                  <ul className="text-blue-800 text-left space-y-1">
                    <li>• Sabit Sidebar ve Header</li>
                    <li>• Dinamik içerik değişimi</li>
                    <li>• Mobil uyumlu tasarım</li>
                    <li>• Sayfa yenilenmeden geçiş</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'orders':
        return (
          <OrdersPage 
            onCreateOrder={() => setIsCreateModalOpen(true)}
            isCreateModalOpen={isCreateModalOpen}
            onCloseModal={() => setIsCreateModalOpen(false)}
          />
        );
      
      case 'customers':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Müşteriler</h2>
            <p className="text-gray-600">Müşteri yönetimi sayfası burada olacak.</p>
          </div>
        );
      
      case 'reports':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Raporlar</h2>
            <p className="text-gray-600">Raporlama sayfası burada olacak.</p>
          </div>
        );
      
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ayarlar</h2>
            <p className="text-gray-600">Sistem ayarları sayfası burada olacak.</p>
          </div>
        );
      
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sayfa Bulunamadı</h2>
            <p className="text-gray-600">Seçilen sayfa bulunamadı.</p>
          </div>
        );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out fixed lg:static z-50`}>
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
          onPageChange={handlePageChange}
          currentPage={currentPage}
          onCreateOrder={() => {
            handlePageChange('orders');
            setIsCreateModalOpen(true);
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300 min-w-0">
        {/* Header */}
        <Header 
          user={user}
          onLogout={handleLogout}
        />

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onSidebarToggle={handleMobileSidebarToggle}
      />
    </div>
  );
}
