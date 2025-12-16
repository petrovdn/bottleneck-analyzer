'use client';

import { X, RefreshCw, Plus } from 'lucide-react';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'replace' | 'merge') => void;
  importType: 'single' | 'full';
  conflictCount?: number;
}

export default function ImportDialog({
  isOpen,
  onClose,
  onConfirm,
  importType,
  conflictCount = 0,
}: ImportDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Импорт данных</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            {importType === 'single'
              ? 'Выберите, как импортировать точку улучшения:'
              : 'Выберите, как импортировать данные:'}
          </p>

          {conflictCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                Обнаружено конфликтов: <strong>{conflictCount}</strong>
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => onConfirm('replace')}
              className="w-full flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Заменить существующие данные</div>
                <div className="text-sm text-gray-600">
                  {importType === 'single'
                    ? 'Текущая точка улучшения будет заменена импортируемой'
                    : 'Все существующие данные будут заменены импортируемыми'}
                </div>
              </div>
            </button>

            <button
              onClick={() => onConfirm('merge')}
              className="w-full flex items-center gap-3 p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition-all text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Добавить к существующим данным</div>
                <div className="text-sm text-gray-600">
                  {importType === 'single'
                    ? 'Точка улучшения будет добавлена (при конфликте ID будет заменена)'
                    : 'Данные будут объединены с существующими (конфликты по ID будут заменены)'}
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

