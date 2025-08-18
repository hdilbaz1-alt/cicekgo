'use client';

import { useState } from 'react';
import { orderService } from '@/services/orderService';

interface OrderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreateOrderRequest {
  orderId: string;
  orderStatus: string;
  orderSender: string;
  orderTo: string;
  orderDeliveryDate: string;
  orderAmount: number;
  orderRemainingAmount: number;
  orderProductType: string;
  extraNote: string;
  cardNote: string;
  customerNote: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  isNotified: boolean;
  payments: Array<{
    paymentAmount: number;
    paymentMethodId: number;
    paymentDate: string;
  }>;
}

export default function OrderCreateModal({ isOpen, onClose, onSuccess }: OrderCreateModalProps) {
  const [formData, setFormData] = useState<CreateOrderRequest>({
    orderId: '',
    orderStatus: 'Beklemede',
    orderSender: '',
    orderTo: '',
    orderDeliveryDate: '',
    orderAmount: 0,
    orderRemainingAmount: 0,
    orderProductType: '',
    extraNote: '',
    cardNote: '',
    customerNote: '',
    senderName: '',
    senderPhone: '',
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    isNotified: true,
    payments: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form değişikliklerini handle et
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      const numValue = parseFloat(value) || 0;
      setFormData(prev => {
        const newData = { ...prev, [name]: numValue };
        
        // Eğer orderAmount değişiyorsa, orderRemainingAmount'u da güncelle
        if (name === 'orderAmount') {
          newData.orderRemainingAmount = numValue;
        }
        
        // Eğer orderRemainingAmount değişiyorsa, orderAmount'dan büyük olamaz
        if (name === 'orderRemainingAmount' && numValue > newData.orderAmount) {
          newData.orderRemainingAmount = newData.orderAmount;
        }
        
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Sender ve recipient bilgilerini senkronize et
  const handleSenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // orderSender ve senderName'i senkronize et
      ...(name === 'senderName' && { orderSender: value }),
      ...(name === 'orderSender' && { senderName: value })
    }));
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // orderTo ve recipientName'i senkronize et
      ...(name === 'recipientName' && { orderTo: value }),
      ...(name === 'orderTo' && { recipientName: value })
    }));
  };

  // Sipariş oluştur
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validasyonlar
    if (formData.orderRemainingAmount > formData.orderAmount) {
      setError('Kalan tutar, toplam tutardan büyük olamaz');
      setLoading(false);
      return;
    }

    try {
      const response = await orderService.createOrder(formData);
      if (response.success) {
        onSuccess();
        onClose();
        // Formu temizle
        setFormData({
          orderId: '',
          orderStatus: 'Beklemede',
          orderSender: '',
          orderTo: '',
          orderDeliveryDate: '',
          orderAmount: 0,
          orderRemainingAmount: 0,
          orderProductType: '',
          extraNote: '',
          cardNote: '',
          customerNote: '',
          senderName: '',
          senderPhone: '',
          recipientName: '',
          recipientPhone: '',
          recipientAddress: '',
          isNotified: true,
          payments: []
        });
      } else {
        setError(response.message || 'Sipariş oluşturulurken hata oluştu');
      }
    } catch (err: any) {
      setError(err.message || 'Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

     return (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
       <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                 {/* Header */}
         <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
           <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Yeni Sipariş Oluştur</h2>
           <button
             onClick={onClose}
             className="text-gray-400 hover:text-gray-600 transition-colors p-1"
           >
             <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
         </div>

                 {/* Form */}
         <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 text-sm">{error}</span>
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sipariş Kodu *
                </label>
                <input
                  type="text"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Sipariş kodu girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sipariş Durumu *
                </label>
                <select
                  name="orderStatus"
                  value={formData.orderStatus}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="Beklemede">Beklemede</option>
                  <option value="Onaylandı">Onaylandı</option>
                  <option value="Hazırlanıyor">Hazırlanıyor</option>
                  <option value="Teslimatta">Teslimatta</option>
                  <option value="Teslim Edildi">Teslim Edildi</option>
                  <option value="İptal Edildi">İptal Edildi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ürün Türü *
                </label>
                <select
                  name="orderProductType"
                  value={formData.orderProductType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Seçiniz</option>
                  <option value="Buket">Buket</option>
                  <option value="Çelenk">Çelenk</option>
                  <option value="Vazo">Vaza</option>
                  <option value="Kutu">Kutu</option>
                  <option value="Diğer">Diğer</option>
                </select>
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gönderici Adı *
                </label>
                <input
                  type="text"
                  name="senderName"
                  value={formData.senderName}
                  onChange={handleSenderChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Gönderici adı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gönderici Telefon *
                </label>
                <input
                  type="tel"
                  name="senderPhone"
                  value={formData.senderPhone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="0555 123 45 67"
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alıcı Adı *
                </label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleRecipientChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Alıcı adı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alıcı Telefon *
                </label>
                <input
                  type="tel"
                  name="recipientPhone"
                  value={formData.recipientPhone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="0555 123 45 67"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teslimat Adresi *
                </label>
                <textarea
                  name="recipientAddress"
                  value={formData.recipientAddress}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Teslimat adresi"
                />
              </div>
            </div>
          </div>

          {/* Teslimat ve Tutar Bilgileri */}
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Teslimat ve Tutar Bilgileri
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teslimat Tarihi *
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.orderDeliveryDate.split('T')[0]}
                  onChange={(e) => {
                    const date = e.target.value;
                    const time = formData.orderDeliveryDate.split('T')[1] || '12:00';
                    setFormData(prev => ({
                      ...prev,
                      orderDeliveryDate: `${date}T${time}`
                    }));
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teslimat Saati *
                </label>
                <input
                  type="time"
                  value={formData.orderDeliveryDate.split('T')[1] || '12:00'}
                  onChange={(e) => {
                    const date = formData.orderDeliveryDate.split('T')[0];
                    const time = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      orderDeliveryDate: `${date}T${time}`
                    }));
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toplam Tutar (₺) *
                </label>
                <input
                  type="number"
                  name="orderAmount"
                  value={formData.orderAmount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kalan Tutar (₺) *
                </label>
                <input
                  type="number"
                  name="orderRemainingAmount"
                  value={formData.orderRemainingAmount}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max={formData.orderAmount}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="0.00"
                />
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  placeholder="Kart notu"
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
                  placeholder="Müşteri notu"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ekstra Not
                </label>
                <textarea
                  name="extraNote"
                  value={formData.extraNote}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Ekstra notlar"
                />
              </div>
            </div>
          </div>

          {/* Bildirim */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isNotified"
                name="isNotified"
                checked={formData.isNotified}
                onChange={(e) => setFormData(prev => ({ ...prev, isNotified: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isNotified" className="ml-2 block text-sm text-gray-900">
                Müşteriye bildirim gönder
              </label>
            </div>
          </div>

                     {/* Butonlar */}
           <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Oluşturuluyor...
                </div>
              ) : (
                'Sipariş Oluştur'
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
