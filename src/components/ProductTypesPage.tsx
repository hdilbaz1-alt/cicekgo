'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/components/NotificationSystem';
import { BASE_URL, ENDPOINTS } from '@/config/api';

interface ProductType {
  id: number;
  productName: string;
}

interface ProductTypeAddRequest {
  productName: string;
}

interface ProductTypeUpdateRequest {
  productName: string;
}

export default function ProductTypesPage() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const { showNotification, showConfirm } = useNotification();

  // Form state
  const [formData, setFormData] = useState<ProductTypeAddRequest>({
    productName: ''
  });

  // Ürün türlerini getir
  const fetchProductTypes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification({
          type: 'error',
          title: 'Hata',
          message: 'Oturum süresi dolmuş.'
        });
        return;
      }

      const response = await fetch(`${BASE_URL}${ENDPOINTS.PRODUCT_TYPE_LIST}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      const result = await response.json();
      setProductTypes(result.data || []);
    } catch (error) {
      console.error('Ürün türleri getirilemedi:', error);
      showNotification({
        type: 'error',
        title: 'Hata',
        message: 'Ürün türleri yüklenirken bir hata oluştu.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  // Form değişikliklerini handle et
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Yeni ürün türü ekle
  const handleAddProductType = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName.trim()) {
      showNotification({
        type: 'warning',
        title: 'Uyarı',
        message: 'Ürün adı boş olamaz.'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification({
          type: 'error',
          title: 'Hata',
          message: 'Oturum süresi dolmuş.'
        });
        return;
      }

      const response = await fetch(`${BASE_URL}${ENDPOINTS.PRODUCT_TYPE_ADD}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      showNotification({
        type: 'success',
        title: 'Başarılı',
        message: 'Ürün türü başarıyla eklendi.'
      });
      setIsAddModalOpen(false);
      setFormData({ productName: '' });
      fetchProductTypes();
    } catch (error) {
      console.error('Ürün türü eklenemedi:', error);
      showNotification({
        type: 'error',
        title: 'Hata',
        message: 'Ürün türü eklenirken bir hata oluştu.'
      });
    }
  };

  // Düzenleme modalını aç
  const handleEdit = (productType: ProductType) => {
    setEditingProductType(productType);
    setFormData({
      productName: productType.productName
    });
    setIsEditModalOpen(true);
  };

  // Ürün türü güncelle
  const handleUpdateProductType = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProductType || !formData.productName.trim()) {
      showNotification({
        type: 'warning',
        title: 'Uyarı',
        message: 'Ürün adı boş olamaz.'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification({
          type: 'error',
          title: 'Hata',
          message: 'Oturum süresi dolmuş.'
        });
        return;
      }

      const response = await fetch(`${BASE_URL}${ENDPOINTS.PRODUCT_TYPE_UPDATE}/${editingProductType.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      showNotification({
        type: 'success',
        title: 'Başarılı',
        message: 'Ürün türü başarıyla güncellendi.'
      });
      setIsEditModalOpen(false);
      setEditingProductType(null);
      setFormData({ productName: '' });
      fetchProductTypes();
    } catch (error) {
      console.error('Ürün türü güncellenemedi:', error);
      showNotification({
        type: 'error',
        title: 'Hata',
        message: 'Ürün türü güncellenirken bir hata oluştu.'
      });
    }
  };

  // Ürün türü sil
  const handleDelete = (productType: ProductType) => {
    showConfirm({
      title: 'Ürün Türünü Sil',
      message: `"${productType.productName}" ürün türünü silmek istediğinizden emin misiniz?`,
      confirmText: 'Sil',
      cancelText: 'İptal',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            showNotification({
              type: 'error',
              title: 'Hata',
              message: 'Oturum süresi dolmuş.'
            });
            return;
          }

          const response = await fetch(`${BASE_URL}${ENDPOINTS.PRODUCT_TYPE_DELETE}/${productType.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('HTTP error! status: ' + response.status);
          }

          showNotification({
            type: 'success',
            title: 'Başarılı',
            message: 'Ürün türü başarıyla silindi.'
          });
          fetchProductTypes();
        } catch (error) {
          console.error('Ürün türü silinemedi:', error);
          showNotification({
            type: 'error',
            title: 'Hata',
            message: 'Ürün türü silinirken bir hata oluştu.'
          });
        }
      }
    });
  };

  // Modal kapatma
  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingProductType(null);
    setFormData({ productName: '' });
  };

  // ESC tuşu ile modal kapatma
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModals();
      }
    };

    if (isAddModalOpen || isEditModalOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isAddModalOpen, isEditModalOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Başlık ve Buton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Ürünler</h1>
        </div>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Yeni Ürün Ekle
        </button>
      </div>

      {/* Ürünler Listesi */}
      {productTypes.length > 0 ? (
        <div className="space-y-4">
          {/* Toplam Ürün Bilgisi */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Ürün türlerini yönetin ve düzenleyin</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Toplam {productTypes.length} ürün türü bulunmaktadır</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{productTypes.length}</div>
                <div className="text-xs sm:text-sm text-gray-500">Toplam Ürün</div>
              </div>
            </div>
          </div>

          {/* Ürünler */}
          <div className="space-y-4">
            {productTypes.map((productType) => (
              <div key={productType.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 sm:p-3 rounded-lg flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                          {productType.productName}
                        </h3>
                        <span className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto">
                          ID: {productType.id}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Durum:</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md">
                            Aktif
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center sm:justify-end space-x-2 sm:space-x-3">
                    <button
                      onClick={() => handleEdit(productType)}
                      className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-md"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(productType)}
                      className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-lg text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 hover:shadow-md"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Ürün türü bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">Yeni bir ürün türü ekleyerek başlayın.</p>
        </div>
      )}

      {/* Yeni Ürün Ekleme Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModals}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full mx-4">
              <form onSubmit={handleAddProductType}>
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Yeni Ürün Ekle
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ürün Adı
                          </label>
                          <input
                            type="text"
                            name="productName"
                            value={formData.productName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                            placeholder="Örn: Buket, Aranjman, Vazo"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ürün Düzenleme Modal */}
      {isEditModalOpen && editingProductType && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModals}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full mx-4">
              <form onSubmit={handleUpdateProductType}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Ürün Düzenle
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ürün Adı
                          </label>
                          <input
                            type="text"
                            name="productName"
                            value={formData.productName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                            placeholder="Örn: Buket, Aranjman, Vazo"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Güncelle
                  </button>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
