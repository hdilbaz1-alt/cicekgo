'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Bildirim türleri
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Bildirim interface'i
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  showClose?: boolean;
}

// Onay dialog interface'i
export interface ConfirmDialog {
  id: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

// Context interface'i
interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showConfirm: (dialog: Omit<ConfirmDialog, 'id'>) => void;
  clearNotification: (id: string) => void;
  clearConfirm: (id: string) => void;
}

// Context oluştur
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmDialogs, setConfirmDialogs] = useState<ConfirmDialog[]>([]);

  // Bildirim göster
  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = {
      ...notification,
      id,
      showClose: notification.showClose ?? true,
      duration: notification.duration ?? 5000
    };

    setNotifications(prev => [...prev, newNotification]);

    // Otomatik kaldırma
    if (newNotification.duration > 0) {
      setTimeout(() => {
        clearNotification(id);
      }, newNotification.duration);
    }
  };

  // Onay dialog göster
  const showConfirm = (dialog: Omit<ConfirmDialog, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newDialog = {
      ...dialog,
      id,
      confirmText: dialog.confirmText ?? 'Onayla',
      cancelText: dialog.cancelText ?? 'İptal'
    };

    setConfirmDialogs(prev => [...prev, newDialog]);
  };

  // Bildirim kaldır
  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Onay dialog kaldır
  const clearConfirm = (id: string) => {
    setConfirmDialogs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <NotificationContext.Provider value={{
      showNotification,
      showConfirm,
      clearNotification,
      clearConfirm
    }}>
      {children}
      
      {/* Toast Notifications */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-3">
        {notifications.map(notification => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={() => clearNotification(notification.id)}
          />
        ))}
      </div>

      {/* Confirmation Dialogs */}
      {confirmDialogs.map(dialog => (
        <ConfirmDialog
          key={dialog.id}
          dialog={dialog}
          onConfirm={() => {
            dialog.onConfirm();
            clearConfirm(dialog.id);
          }}
          onCancel={() => {
            dialog.onCancel?.();
            clearConfirm(dialog.id);
          }}
        />
      ))}
    </NotificationContext.Provider>
  );
}

// Hook
export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Toast Notification Component
function ToastNotification({ notification, onClose }: { notification: Notification; onClose: () => void }) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={`w-[calc(100vw-2rem)] max-w-sm sm:max-w-md bg-white shadow-xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border ${getColors()}`}>
      <div className="px-5 py-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{notification.title}</p>
            <p className="mt-1 text-sm opacity-90">{notification.message}</p>
          </div>
          {notification.showClose && (
            <div className="ml-3 flex-shrink-0 flex">
              <button
                className="rounded-md p-1 inline-flex text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                onClick={onClose}
              >
                <span className="sr-only">Kapat</span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Confirmation Dialog Component
function ConfirmDialog({ dialog, onConfirm, onCancel }: { 
  dialog: ConfirmDialog; 
  onConfirm: () => void; 
  onCancel: () => void; 
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {dialog.title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {dialog.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onConfirm}
            >
              {dialog.confirmText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onCancel}
            >
              {dialog.cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
