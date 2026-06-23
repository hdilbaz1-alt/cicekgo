'use client';

import { useState, useEffect } from 'react';
import { orderService } from '@/services/orderService';

interface OrderUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: { 
    orderCode: string; 
    orderPkId: number; 
    orderStatus: string; 
    orderAmount: number; 
    orderRemainingAmount: number; 
    productType: string; 
    deliveryDate: string; 
    extraNote?: string; 
    cardNote?: string; 
    customerNote?: string; 
    senderName: string; 
    senderPhone: string; 
    recipientName: string; 
    recipientPhone: string; 
    recipientAddress?: string; 
    isNotified: boolean; 
    customerId?: number; // Müşteri ID'si
  } | null; // Mevcut sipariş verisi
}

export default function OrderUpdateModal({ isOpen, onClose, onSuccess, order }: OrderUpdateModalProps) {
  const [formData, setFormData] = useState({
    orderPkId: 0,
    orderStatus: '',
    orderSender: '',
    orderTo: '',
    orderDeliveryDate: '',
    orderAmount: 0,
    orderRemainingAmount: 0,
    orderProductType: '',
    customerId: undefined as number | undefined, // Müşteri ID'si
    extraNote: '',
    cardNote: '',
    customerNote: '',
    senderName: '',
    senderPhone: '',
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    isNotified: false,
    replacePayments: true,
    payments: [{
      paymentAmount: 0,
      paymentMethodId: 0,
      paymentDate: ''
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ESC tuşu ile modal kapatma
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Modal açıldığında mevcut sipariş verilerini form'a yükle
  useEffect(() => {
    if (isOpen && order) {
      const deliveryDate = new Date(order.deliveryDate);
      const paymentDate = new Date();
      
      setFormData({
        orderPkId: order.orderPkId,
        orderStatus: order.orderStatus,
        orderSender: order.senderName,
        orderTo: order.recipientName,
        orderDeliveryDate: deliveryDate.toISOString(),
        orderAmount: order.orderAmount,
        orderRemainingAmount: order.orderRemainingAmount,
        orderProductType: order.productType,
        customerId: order.customerId, // Müşteri ID'sini ekle
        extraNote: order.extraNote || '',
        cardNote: order.cardNote || '',
        customerNote: order.customerNote || '',
        senderName: order.senderName,
        senderPhone: order.senderPhone,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        recipientAddress: order.recipientAddress || '',
        isNotified: order.isNotified,
        replacePayments: true,
        payments: [{
          paymentAmount: order.orderAmount - order.orderRemainingAmount,
          paymentMethodId: 0,
          paymentDate: paymentDate.toISOString()
        }]
      });
    }
  }, [isOpen, order]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!order) {
        setError('Sipariş bilgisi bulunamadı');
        return;
      }
      const response = await orderService.updateOrder(order.orderCode, formData);
      
      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Güncelleme başarısız');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Bağlantı hatası';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Sipariş Güncelle - #{order?.orderCode}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

                     {/* Sipariş Bilgileri */}
           <div className="bg-gray-50 rounded-lg p-4">
             <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
               <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
               Sipariş Bilgileri
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Sipariş Kodu (Read-only) */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Sipariş Kodu
                 </label>
                 <input
                   type="text"
                   value={order?.orderCode || ''}
                   disabled
                   className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                 />
               </div>

               {/* Durum */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Durum *
                 </label>
                 <select
                   name="orderStatus"
                   value={formData.orderStatus}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                   required
                 >
                   <option value="">Durum Seçin</option>
                   <option value="Beklemede">Beklemede</option>
                   <option value="Onaylandı">Onaylandı</option>
                   <option value="Hazırlanıyor">Hazırlanıyor</option>
                   <option value="Teslimatta">Teslimatta</option>
                   <option value="Teslim Edildi">Teslim Edildi</option>
                   <option value="İptal Edildi">İptal Edildi</option>
                 </select>
               </div>

               {/* Ürün Türü */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Ürün Türü *
                 </label>
                 <input
                   type="text"
                   name="orderProductType"
                   value={formData.orderProductType}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                   required
                 />
               </div>

               {/* Teslimat Tarihi */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Teslimat Tarihi *
                 </label>
                 <input
                   type="datetime-local"
                   name="orderDeliveryDate"
                   value={formData.orderDeliveryDate.slice(0, 16)}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                   required
                 />
               </div>

               {/* Tutarlar */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Toplam Tutar *
                 </label>
                 <input
                   type="number"
                   name="orderAmount"
                   value={formData.orderAmount}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                   disabled
                   min="0"
                   step="0.01"
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   Sipariş tutarı sadece ödemelerle güncellenir
                 </p>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Kalan Tutar *
                 </label>
                 <input
                   type="number"
                   name="orderRemainingAmount"
                   value={formData.orderRemainingAmount}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                   disabled
                   min="0"
                   step="0.01"
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   Kalan tutar sadece ödemelerle güncellenir
                 </p>
               </div>
             </div>
           </div>

           {/* Gönderen Bilgileri */}
           <div className="bg-blue-50 rounded-lg p-4">
             <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
               <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
               </svg>
               Gönderen Bilgileri
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Ad Soyad *
                 </label>
                 <input
                   type="text"
                   name="senderName"
                   value={formData.senderName}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Telefon *
                 </label>
                 <input
                   type="tel"
                   name="senderPhone"
                   value={formData.senderPhone}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                   required
                 />
               </div>
             </div>
           </div>

           {/* Alıcı Bilgileri */}
           <div className="bg-green-50 rounded-lg p-4">
             <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
               <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
               </svg>
               Alıcı Bilgileri
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Ad Soyad *
                 </label>
                 <input
                   type="text"
                   name="recipientName"
                   value={formData.recipientName}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Telefon *
                 </label>
                 <input
                   type="tel"
                   name="recipientPhone"
                   value={formData.recipientPhone}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                   required
                 />
               </div>
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Adres
                 </label>
                 <textarea
                   name="recipientAddress"
                   value={formData.recipientAddress}
                   onChange={handleInputChange}
                   rows={3}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                 />
               </div>
             </div>
           </div>

           {/* Bildirim */}
           <div className="bg-yellow-50 rounded-lg p-4">
             <div className="flex items-center">
               <input
                 type="checkbox"
                 name="isNotified"
                 checked={formData.isNotified}
                 onChange={handleInputChange}
                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
               />
               <label className="ml-2 block text-sm text-gray-900">
                 Bildirim Gönderildi
               </label>
             </div>
           </div>

                     {/* Notlar */}
           <div className="bg-purple-50 rounded-lg p-4">
             <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
               <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
               </svg>
               Notlar
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Ekstra Not
                 </label>
                 <textarea
                   name="extraNote"
                   value={formData.extraNote}
                   onChange={handleInputChange}
                   rows={3}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Kart Notu
                 </label>
                 <textarea
                   name="cardNote"
                   value={formData.cardNote}
                   onChange={handleInputChange}
                   rows={3}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Müşteri Notu
                 </label>
                 <textarea
                   name="customerNote"
                   value={formData.customerNote}
                   onChange={handleInputChange}
                   rows={3}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                 />
               </div>
             </div>
           </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
