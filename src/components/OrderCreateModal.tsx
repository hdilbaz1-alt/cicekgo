'use client';

import { useState, useEffect } from 'react';
import { orderService, getOrderCodes, updateOrderCode, Customer } from '@/services/orderService';
import CustomerSelectionModal from './CustomerSelectionModal';
import { BASE_URL, ENDPOINTS } from '@/config/api';

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
  customerId?: number; // Cari hesap için müşteri ID
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
    customerId: undefined, // Cari hesap için müşteri ID
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
  const [error, setError] = useState<string | null>(null);
  const [orderCodes, setOrderCodes] = useState<Array<{ id: number; orderStartCode: string; orderLastCode: string }>>([]);
  const [selectedOrderCode, setSelectedOrderCode] = useState<{ id: number; orderStartCode: string; orderLastCode: string } | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [productTypes, setProductTypes] = useState<Array<{ id: number; productName: string }>>([]);
  const [orderStatuses, setOrderStatuses] = useState<Array<{ id: number; statusName: string }>>([]);

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

  // Modal açıldığında sipariş kodlarını, ürün türlerini ve teslimat durumlarını getir
  useEffect(() => {
    if (isOpen) {
      fetchOrderCodes();
      fetchProductTypes();
      fetchOrderStatuses();
    }
  }, [isOpen]);

  // Sipariş kodlarını getir
  const fetchOrderCodes = async () => {
    try {
      const response = await getOrderCodes();
      if (response.success && response.data.length > 0) {
        setOrderCodes(response.data);
        // Eğer tek sipariş kodu varsa otomatik seç, birden fazla varsa seçtir
        if (response.data.length === 1) {
          setSelectedOrderCode(response.data[0]);
        } else {
          setSelectedOrderCode(null); // Kullanıcı seçim yapsın
        }
      }
    } catch (err: unknown) {
      console.error('Sipariş kodları getirilemedi:', err);
      // Eğer 401 hatası varsa token problemi olabilir
      if (err instanceof Error && err.message.includes('401')) {
        setError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        // 3 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        setError('Sipariş kodları yüklenirken hata oluştu.');
      }
    }
  };

  // Ürün türlerini getir
  const fetchProductTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${BASE_URL}${ENDPOINTS.PRODUCT_TYPE_LIST}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setProductTypes(result.data || []);
      }
    } catch (err) {
      console.error('Ürün türleri getirilemedi:', err);
    }
  };

  // Teslimat durumlarını getir
  const fetchOrderStatuses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${BASE_URL}${ENDPOINTS.ORDER_STATUS_LIST}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setOrderStatuses(result.data || []);
      }
    } catch (err) {
      console.error('Teslimat durumları getirilemedi:', err);
    }
  };

  // Seçilen sipariş koduna göre otomatik kod oluştur
  const generateOrderCode = () => {
    if (!selectedOrderCode) return;
    
    const today = new Date();
    const dateString = today.getFullYear().toString() + 
                      String(today.getMonth() + 1).padStart(2, '0') + 
                      String(today.getDate()).padStart(2, '0');
    
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const generatedOrderCode = `${selectedOrderCode.orderStartCode}${selectedOrderCode.orderLastCode}${dateString}${randomCode}`;
    
    setFormData(prev => ({
      ...prev,
      orderId: generatedOrderCode
    }));
  };

  // Sipariş kodu seçimi değiştiğinde otomatik kod oluştur
  useEffect(() => {
    if (selectedOrderCode) {
      generateOrderCode();
    }
  }, [selectedOrderCode]);

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

  // Müşteri seçildiğinde gönderici bilgilerini doldur
  const handleCustomerSelect = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.customerId, // Cari hesap için müşteri ID'yi ekle
      senderName: customer.customerName || '',
      senderPhone: customer.phone || '',
      orderSender: customer.customerName || '',
    }));
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
        // Sipariş kodu sırasını güncelle
        if (selectedOrderCode) {
          try {
            await updateOrderCode(selectedOrderCode.id, {
              orderStartCode: selectedOrderCode.orderStartCode,
              orderLastCode: (parseInt(selectedOrderCode.orderLastCode) + 1).toString()
            });
          } catch (err) {
            console.error('Sipariş kodu güncellenemedi:', err);
          }
        }
        
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
          customerId: undefined, // Cari hesap için müşteri ID'yi temizle
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
    } catch (err) {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Sipariş Oluştur</h2>
            <p className="text-sm text-gray-600 mt-1">Yeni bir sipariş oluşturun</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
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
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-blue-900">Sipariş Bilgileri</h3>
              </div>
              
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Sipariş Kodu Seçimi - Sadece birden fazla kod varsa göster */}
                 {orderCodes.length > 1 && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Sipariş Kodu Türü
                     </label>
                     <select
                       value={selectedOrderCode?.id || ''}
                       onChange={(e) => {
                         const selected = orderCodes.find(code => code.id === parseInt(e.target.value));
                         setSelectedOrderCode(selected || null);
                       }}
                       className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                     >
                       <option value="">Sipariş kodu seçin</option>
                       {orderCodes.map((code) => (
                         <option key={code.id} value={code.id}>
                           {code.orderStartCode} (Sıra: {code.orderLastCode})
                         </option>
                       ))}
                     </select>
                   </div>
                 )}

                 {/* Tek kod varsa bilgi göster */}
                 {orderCodes.length === 1 && selectedOrderCode && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Seçilen Sipariş Kodu
                     </label>
                     <div className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700">
                       {selectedOrderCode.orderStartCode} (Sıra: {selectedOrderCode.orderLastCode})
                     </div>
                   </div>
                 )}

                {/* Oluşturulan Sipariş Kodu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oluşturulan Sipariş Kodu
                  </label>
                  <input
                    type="text"
                    name="orderId"
                    value={formData.orderId}
                    readOnly
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Durum */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durum
                  </label>
                  <select
                    name="orderStatus"
                    value={formData.orderStatus}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Durum seçin</option>
                    {orderStatuses.map((status) => (
                      <option key={status.id} value={status.statusName}>
                        {status.statusName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ürün Türü */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ürün Türü
                  </label>
                  <select
                    name="orderProductType"
                    value={formData.orderProductType}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Ürün türü seçin</option>
                    {productTypes.map((productType) => (
                      <option key={productType.id} value={productType.productName}>
                        {productType.productName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Gönderici Bilgileri */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-green-900">Gönderici Bilgileri</h3>
                </div>
                
                {/* Cariye Kaydet Butonu - Müşteri seçilmediyse göster */}
                {!formData.customerId && formData.senderName && (
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Cariye Kaydet
                  </button>
                )}
                
                {/* Müşteri seçildiyse göster */}
                {formData.customerId && (
                  <div className="flex items-center text-green-600 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Cari Müşteri
                  </div>
                )}
              </div>
              
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Gönderici Adı
                   </label>
                   <div className="relative">
                     <input
                       type="text"
                       name="senderName"
                       value={formData.senderName}
                       onChange={handleSenderChange}
                       className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                       placeholder="Gönderici adı"
                     />
                     <button
                       type="button"
                       onClick={() => setIsCustomerModalOpen(true)}
                       className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                     >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                       </svg>
                     </button>
                   </div>
                 </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gönderici Telefon
                  </label>
                  <input
                    type="tel"
                    name="senderPhone"
                    value={formData.senderPhone}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="0555 123 45 67"
                  />
                </div>
              </div>
            </div>

            {/* Alıcı Bilgileri */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-semibold text-purple-900">Alıcı Bilgileri</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alıcı Adı
                  </label>
                  <input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleRecipientChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Alıcı adı"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alıcı Telefon
                  </label>
                  <input
                    type="tel"
                    name="recipientPhone"
                    value={formData.recipientPhone}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="0555 123 45 67"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teslimat Adresi
                  </label>
                  <textarea
                    name="recipientAddress"
                    value={formData.recipientAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Teslimat adresi"
                  />
                </div>
              </div>
            </div>

            {/* Teslimat ve Tutar Bilgileri */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <h3 className="text-lg font-semibold text-yellow-900">Teslimat ve Tutar Bilgileri</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teslimat Tarihi
                  </label>
                  <input
                    type="datetime-local"
                    name="orderDeliveryDate"
                    value={formData.orderDeliveryDate}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sipariş Tutarı (₺)
                  </label>
                  <input
                    type="number"
                    name="orderAmount"
                    value={formData.orderAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kalan Tutar (₺)
                  </label>
                  <input
                    type="number"
                    name="orderRemainingAmount"
                    value={formData.orderRemainingAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Notlar */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="text-lg font-semibold text-indigo-900">Notlar</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ekstra Not
                  </label>
                  <textarea
                    name="extraNote"
                    value={formData.extraNote}
                    onChange={handleInputChange}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Ekstra notlar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kart Notu
                  </label>
                  <textarea
                    name="cardNote"
                    value={formData.cardNote}
                    onChange={handleInputChange}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Kart notu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Müşteri Notu
                  </label>
                  <textarea
                    name="customerNote"
                    value={formData.customerNote}
                    onChange={handleInputChange}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Müşteri notu"
                  />
                </div>
              </div>
            </div>

            {/* Bildirim */}
            <div className="bg-pink-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4.19A2 2 0 004 6v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-1.81 1.19z" />
                </svg>
                <h3 className="text-lg font-semibold text-pink-900">Bildirim</h3>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isNotified"
                  checked={formData.isNotified}
                  onChange={(e) => setFormData(prev => ({ ...prev, isNotified: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Müşteriye bildirim gönder
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            İptal
          </button>
                     <button
             onClick={handleSubmit}
             disabled={loading || !selectedOrderCode}
             className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
           >
             {loading ? 'Oluşturuluyor...' : 'Sipariş Oluştur'}
           </button>
                 </div>
       </div>

       {/* Müşteri Seçim Modal */}
       <CustomerSelectionModal
         isOpen={isCustomerModalOpen}
         onClose={() => setIsCustomerModalOpen(false)}
         onSelect={handleCustomerSelect}
       />
     </div>
   );
 }
