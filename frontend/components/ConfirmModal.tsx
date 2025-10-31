'use client';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'info' | 'warning' | 'danger';
}

export default function ConfirmModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info'
}: ConfirmModalProps) {
  const colors = {
    info: 'bg-blue-600 hover:bg-blue-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    danger: 'bg-red-600 hover:bg-red-700'
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    danger: '🔥'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 animate-fade-in">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border-2 border-gray-700 animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{icons[type]}</span>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>

        {/* Message */}
        <p className="text-gray-300 mb-6">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 ${colors[type]} text-white rounded-lg font-medium transition`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

