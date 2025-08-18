'use client';

import { useState, useEffect } from 'react';
import { orderService } from '@/services/orderService';
import OrderCreateModal from './OrderCreateModal';
import OrderUpdateModal from './OrderUpdateModal';

interface Order {
  orderPkId: number;
  orderCode: string;
  orderStatus: string;
  productType: string;
  createdDate: string;
  deliveryDate: string;
  createdUser: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  totalPaid: number;
  lastPaymentDate: string | null;
  orderAmount: number;
  orderRemainingAmount: number;
  isNotified: boolean;
  extraNote: string;
  cardNote: string;
  customerNote: string;
}

interface OrdersPageProps {
  onCreateOrder?: () => void;
  isCreateModalOpen?: boolean;
  onCloseModal?: () => void;
}

export default function OrdersPage({ onCreateOrder, isCreateModalOpen = false, onCloseModal = () => {} }: OrdersPageProps) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Bugünün tarihini al
  const todayString = today.toISOString().split('T')[0];

  // Seçili tarihin etrafındaki 7 günü al (-3, seçili, +3)
  const getDateRange = () => {
    const days = [];
    const selected = new Date(selectedDate);
    
    // Seçili tarihten 3 gün öncesi ve 3 gün sonrası
    for (let i = -3; i <= 3; i++) {
      const day = new Date(selected);
      day.setDate(selected.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Özet kartları için veriler - dinamik hesaplama
  const summaryData = {
    totalOrders: orders.length,
    delivered: orders.filter(order => order.orderStatus === 'Teslim Edildi').length,
    totalAmount: orders.reduce((sum, order) => sum + order.orderAmount, 0),
    remainingAmount: orders.reduce((sum, order) => sum + order.orderRemainingAmount, 0)
  };

  // Helper fonksiyonlar
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const formatDeliveryDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Geçersiz tarih';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Teslim Edildi':
        return 'bg-green-100 text-green-800';
      case 'Onaylandı':
        return 'bg-blue-100 text-blue-800';
      case 'Hazırlanıyor':
        return 'bg-yellow-100 text-yellow-800';
      case 'İptal Edildi':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Bugünün tarihini kontrol et
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Siparişleri getir
  const fetchOrders = async (date: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      const dateString = date.toISOString().split('T')[0];
      const response = await orderService.getOrders({
        startDate: dateString,
        endDate: dateString,
        page: 1,
        pageSize: 500
      });

      if (response.success) {
        setOrders(response.data.items);
      } else {
        setError(response.message || 'Siparişler yüklenirken hata oluştu');
      }
    } catch (err: any) {
      setError(err.message || 'Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  // Tarih değiştiğinde siparişleri getir
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    fetchOrders(date);
  };

  // Sayfa yüklendiğinde bugünün siparişlerini getir
  useEffect(() => {
    fetchOrders(selectedDate);
  }, []);

  // Yenile butonu
  const handleRefresh = () => {
    fetchOrders(selectedDate);
  };

  // Modal işlemleri
  const handleCreateSuccess = () => {
    fetchOrders(selectedDate);
  };

  const handleUpdateClick = (order: Order) => {
    setSelectedOrder(order);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchOrders(selectedDate);
  };

  return (
    <div className="p-6 space-y-6 relative">
      {/* Hata Mesajı */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Hata</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

                     {/* Tarih Navigasyonu */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tarih Seçimi</h2>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onCreateOrder}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                title="Yeni Sipariş Oluştur"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Sipariş Oluştur</span>
              </button>
              <button
                onClick={() => handleDateChange(today)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                Bugüne Dön
              </button>
            </div>
          </div>
         
                                       <div className="flex overflow-hidden rounded-lg border border-gray-200">
             {getDateRange().map((day, index) => (
               <button
                 key={index}
                 onClick={() => handleDateChange(day)}
                 className={`
                   flex-1 px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4 text-center transition-colors relative border-r border-gray-200 last:border-r-0
                   ${day.toDateString() === selectedDate.toDateString()
                     ? 'bg-green-600 text-white'
                     : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                   }
                   ${isToday(day) ? 'ring-2 ring-red-400' : ''}
                 `}
               >
                 <div className="text-xs font-medium mb-1">
                   {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                 </div>
                 <div className="text-xs sm:text-sm lg:text-base font-bold">
                   {day.getDate()} {day.toLocaleDateString('tr-TR', { month: 'short' })}
                 </div>
                 {isToday(day) && (
                   <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-red-500 rounded-full"></div>
                 )}
               </button>
             ))}
           </div>
          
          <div className="mt-3 sm:mt-4 text-center">
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">
              Seçili Tarih: {formatDate(selectedDate)}
            </span>
          </div>
       </div>

             {/* Özet Kartları */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
         {/* Toplam Sipariş */}
         <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-4 sm:p-5">
           <div className="flex items-center justify-between">
             <div className="min-w-0 flex-1">
               <p className="text-xs sm:text-sm font-semibold text-blue-700 mb-2">Toplam Sipariş</p>
               <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-800 truncate">{summaryData.totalOrders}</p>
             </div>
                           <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 shadow-md">
               <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
             </div>
           </div>
         </div>

         {/* Teslim Edilen */}
         <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-4 sm:p-5">
           <div className="flex items-center justify-between">
             <div className="min-w-0 flex-1">
               <p className="text-xs sm:text-sm font-semibold text-green-700 mb-2">Teslim Edilen</p>
               <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-800 truncate">{summaryData.delivered}</p>
             </div>
                           <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 shadow-md">
               <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
               </svg>
             </div>
           </div>
         </div>

         {/* Toplam Tutar */}
         <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg border border-purple-200 p-4 sm:p-5">
           <div className="flex items-center justify-between">
             <div className="min-w-0 flex-1">
               <p className="text-xs sm:text-sm font-semibold text-purple-700 mb-2">Toplam Tutar</p>
                               <p className="text-base sm:text-lg lg:text-xl font-bold text-purple-800 truncate">{formatCurrency(summaryData.totalAmount)}</p>
             </div>
                           <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 shadow-md">
               <span className="text-white font-bold text-sm sm:text-lg">₺</span>
             </div>
           </div>
         </div>

         {/* Kalan Tutar */}
         <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg border border-orange-200 p-4 sm:p-5">
           <div className="flex items-center justify-between">
             <div className="min-w-0 flex-1">
               <p className="text-xs sm:text-sm font-semibold text-orange-700 mb-2">Kalan Tutar</p>
                               <p className="text-base sm:text-lg lg:text-xl font-bold text-orange-800 truncate">{formatCurrency(summaryData.remainingAmount)}</p>
             </div>
                           <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-2 shadow-md">
               <span className="text-white font-bold text-sm sm:text-lg">₺</span>
             </div>
           </div>
         </div>
       </div>

      {/* Siparişler - Desktop Tablo / Mobile Kart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Tablo Görünümü */}
        <div className="hidden lg:block overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600 text-lg">Siparişler yükleniyor...</span>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sipariş bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">Seçili tarihte sipariş bulunmuyor.</p>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SİPARİŞ KODU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GÖNDEREN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ALICI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TESLİMAT TARİHİ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TUTAR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DURUM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ÜRÜN TÜRÜ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İŞLEM
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.orderPkId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.senderName}</div>
                        <div className="text-sm text-gray-500">{order.senderPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.recipientName}</div>
                        <div className="text-sm text-gray-500">{order.recipientPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDeliveryDate(order.deliveryDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(order.orderAmount)}</div>
                        <div className="text-sm text-gray-500">Kalan: {formatCurrency(order.orderRemainingAmount)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.productType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center hover:bg-gray-200 transition-colors">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center hover:bg-yellow-200 transition-colors">
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleUpdateClick(order)}
                          className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center hover:bg-blue-200 transition-colors"
                        >
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Kart Görünümü */}
        <div className="lg:hidden p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600 text-lg">Siparişler yükleniyor...</span>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sipariş bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">Seçili tarihte sipariş bulunmuyor.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.orderPkId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  {/* Kart Başlığı */}
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Sipariş #{order.orderCode}</h3>
                    
                    {/* Durum, Ürün Türü ve İşlem İkonları */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {order.productType}
                        </span>
                      </div>
                      
                      {/* İşlem İkonları */}
                      <div className="flex space-x-1">
                        <button className="w-6 h-6 sm:w-7 sm:h-7 bg-red-100 rounded flex items-center justify-center hover:bg-red-200 transition-colors">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button className="w-6 h-6 sm:w-7 sm:h-7 bg-yellow-100 rounded flex items-center justify-center hover:bg-yellow-200 transition-colors">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleUpdateClick(order)}
                          className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-100 rounded flex items-center justify-center hover:bg-blue-200 transition-colors"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sipariş Detayları */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Gönderen:</span>
                      <span className="text-gray-900">{order.senderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Gönderen Tel:</span>
                      <span className="text-gray-900">{order.senderPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Alıcı:</span>
                      <span className="text-gray-900">{order.recipientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Alıcı Tel:</span>
                      <span className="text-gray-900">{order.recipientPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Teslimat:</span>
                      <span className="text-gray-900">{formatDeliveryDate(order.deliveryDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Toplam Tutar:</span>
                      <span className="text-green-600 font-semibold">{formatCurrency(order.orderAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Kalan Tutar:</span>
                      <span className="text-orange-600 font-semibold">{formatCurrency(order.orderRemainingAmount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Yenile Butonu */}
      <div className="flex justify-center">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span>{loading ? 'Yükleniyor...' : 'Yenile'}</span>
        </button>
      </div>

      {/* Floating Action Button - Mobil için hızlı erişim */}
      <button
        onClick={onCreateOrder}
        className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors z-40 lg:hidden"
        title="Yeni Sipariş Oluştur"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Sipariş Oluşturma Modal */}
      <OrderCreateModal
        isOpen={isCreateModalOpen}
        onClose={onCloseModal}
        onSuccess={handleCreateSuccess}
      />

      {/* Sipariş Güncelleme Modal */}
      <OrderUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={handleUpdateSuccess}
        order={selectedOrder}
      />
    </div>
  );
}
