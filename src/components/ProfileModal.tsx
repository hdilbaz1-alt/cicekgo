'use client';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantInfo: { name: string; lkStart: string; lkEnd: string; isExpired?: boolean } | null;
  remainingDays: number;
}

export default function ProfileModal({ isOpen, onClose, tenantInfo, remainingDays }: ProfileModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {tenantInfo?.name || 'Profil Bilgileri'}
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

        {/* Content */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Lisans Bilgileri</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Lisans Başlangıç:</span>
                <span className="text-sm font-medium text-gray-900">
                  {tenantInfo?.lkStart ? formatDate(tenantInfo.lkStart) : '-'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Lisans Bitiş:</span>
                <span className="text-sm font-medium text-gray-900">
                  {tenantInfo?.lkEnd ? formatDate(tenantInfo.lkEnd) : '-'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Kalan Kullanım Süresi:</span>
                <span className={`text-sm font-medium ${remainingDays > 7 ? 'text-green-600' : remainingDays > 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {remainingDays} gün
                </span>
              </div>
            </div>
          </div>

          {tenantInfo?.isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm text-red-800">Lisans süreniz dolmuştur!</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

