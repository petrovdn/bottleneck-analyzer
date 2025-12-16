'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  Download,
  Upload,
  Database,
  FileJson,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';
import ImportDialog from './ImportDialog';
import { DialogState } from '@/types';
import {
  exportFullData,
  exportSingleBottleneck,
  importFullData,
  importSingleBottleneck,
  downloadJSON,
  readJSONFile,
  generateFullExportFilename,
  generateSingleBottleneckFilename,
  validateImportData,
} from '@/lib/utils/exportImport';

export default function DataManagement() {
  const {
    businessData,
    multiAgentState,
    bottlenecks,
    refinedBottlenecks,
    dialogState,
    dialogStates,
    importFullData: importFullDataToStore,
    importSingleBottleneck: importSingleBottleneckToStore,
    reset,
    setDialogState,
  } = useAppStore();

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<string | null>(null);
  const [importType, setImportType] = useState<'single' | 'full'>('full');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Собираем все dialogStates из store
  const getAllDialogStates = (): Record<string, DialogState> => {
    const dialogStatesRecord: Record<string, DialogState> = {};
    // Используем Map всех диалогов
    dialogStates.forEach((value, key) => {
      dialogStatesRecord[key] = value;
    });
    // Также добавляем текущий dialogState, если его еще нет в Map
    if (dialogState && !dialogStatesRecord[dialogState.bottleneckId]) {
      dialogStatesRecord[dialogState.bottleneckId] = dialogState;
    }
    return dialogStatesRecord;
  };

  // Экспорт всех данных
  const handleExportAll = () => {
    try {
      const exportData = exportFullData({
        businessData,
        multiAgentState,
        bottlenecks,
        dialogStates: getAllDialogStates(),
        refinedBottlenecks,
      });
      const filename = generateFullExportFilename();
      downloadJSON(exportData, filename);
      setSuccess('Все данные успешно экспортированы');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(`Ошибка при экспорте: ${error.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Экспорт одной точки улучшения
  const handleExportSingle = (bottleneckId: string) => {
    const bottleneck = bottlenecks.find(b => b.id === bottleneckId);
    if (!bottleneck) return;

    const refinedBottleneck = refinedBottlenecks.get(bottleneckId);
    const dialogStateForBottleneck = dialogState?.bottleneckId === bottleneckId ? dialogState : null;

    try {
      const exportData = exportSingleBottleneck(
        bottleneck,
        dialogStateForBottleneck,
        refinedBottleneck || null
      );
      const filename = generateSingleBottleneckFilename(bottleneck);
      downloadJSON(exportData, filename);
      setSuccess(`Точка улучшения "${bottleneck.title}" успешно экспортирована`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(`Ошибка при экспорте: ${error.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Импорт данных
  const handleImportClick = (type: 'single' | 'full') => {
    setImportType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    try {
      const jsonData = await readJSONFile(file);
      const validation = validateImportData(JSON.parse(jsonData));
      
      if (!validation.valid) {
        setError(validation.error || 'Невалидные данные');
        setTimeout(() => setError(null), 5000);
        return;
      }

      // Проверяем тип импорта
      if (validation.exportData?.type === 'single_bottleneck' && importType === 'full') {
        setError('Выбран файл с одной точкой улучшения, но режим импорта - полный. Используйте импорт одной точки.');
        setTimeout(() => setError(null), 5000);
        return;
      }

      if (validation.exportData?.type === 'full_export' && importType === 'single') {
        setError('Выбран файл с полным экспортом, но режим импорта - одна точка. Используйте полный импорт.');
        setTimeout(() => setError(null), 5000);
        return;
      }

      setPendingImportData(jsonData);
      setShowImportDialog(true);
    } catch (error: any) {
      setError(`Ошибка при чтении файла: ${error.message}`);
      setTimeout(() => setError(null), 5000);
    }

    // Сбрасываем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = (mode: 'replace' | 'merge') => {
    if (!pendingImportData) return;

    setError(null);
    setSuccess(null);

    try {
      if (importType === 'full') {
        const importData = importFullData(pendingImportData);
        importFullDataToStore(importData, mode);
        setSuccess('Все данные успешно импортированы');
      } else {
        const importData = importSingleBottleneck(pendingImportData);
        importSingleBottleneckToStore(importData, mode);
        setSuccess('Точка улучшения успешно импортирована');
      }

      setShowImportDialog(false);
      setPendingImportData(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(`Ошибка при импорте: ${error.message}`);
      setShowImportDialog(false);
      setPendingImportData(null);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Очистка всех данных
  const handleClearAll = () => {
    if (confirm('Вы уверены, что хотите очистить все данные? Это действие нельзя отменить.')) {
      reset();
      setDialogState(null);
      setSuccess('Все данные очищены');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Статистика
  const getStats = () => {
    const completedDialogs = dialogState ? 1 : 0; // В текущей реализации только один диалог
    const refinedCount = refinedBottlenecks.size;
    
    // Размер localStorage (приблизительно)
    let localStorageSize = 0;
    try {
      if (typeof window !== 'undefined') {
        const storage = localStorage.getItem('bottleneck-analyzer-storage');
        if (storage) {
          localStorageSize = new Blob([storage]).size;
        }
      }
    } catch (e) {
      // Игнорируем ошибки
    }

    return {
      bottlenecksCount: bottlenecks.length,
      completedDialogs,
      refinedCount,
      localStorageSize,
    };
  };

  const stats = getStats();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление данными</h1>
          <p className="text-gray-600 mt-2">Экспорт, импорт и управление данными проекта</p>
        </div>
      </div>

      {/* Сообщения об ошибках и успехе */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800 flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 flex-1">{success}</p>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Статистика */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Статистика
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Точек улучшения</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{stats.bottlenecksCount}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Завершенных диалогов</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{stats.completedDialogs}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Уточненных точек</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{stats.refinedCount}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Размер данных</div>
            <div className="text-2xl font-bold text-gray-600 mt-1">
              {(stats.localStorageSize / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>
      </div>

      {/* Экспорт */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" />
          Экспорт данных
        </h2>
        <div className="space-y-4">
          <div>
            <button
              onClick={handleExportAll}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Экспортировать все данные
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Экспортирует все точки улучшения, диалоги, мультиагентное состояние и бизнес-данные
            </p>
          </div>

          {bottlenecks.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Экспорт отдельных точек улучшения</h3>
              <div className="space-y-2">
                {bottlenecks.map((bottleneck) => (
                  <div
                    key={bottleneck.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{bottleneck.title}</div>
                      <div className="text-sm text-gray-600">{bottleneck.processArea}</div>
                    </div>
                    <button
                      onClick={() => handleExportSingle(bottleneck.id)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Экспорт
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Импорт */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-green-600" />
          Импорт данных
        </h2>
        <div className="space-y-4">
          <div>
            <button
              onClick={() => handleImportClick('full')}
              className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 mb-2"
            >
              <Upload className="w-5 h-5" />
              Импортировать все данные
            </button>
            <p className="text-sm text-gray-600">
              Импортирует полный экспорт со всеми данными
            </p>
          </div>

          <div>
            <button
              onClick={() => handleImportClick('single')}
              className="w-full md:w-auto px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 mb-2"
            >
              <Upload className="w-5 h-5" />
              Импортировать одну точку улучшения
            </button>
            <p className="text-sm text-gray-600">
              Импортирует одну точку улучшения с диалогом
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Очистка данных */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          Очистка данных
        </h2>
        <div className="space-y-4">
          <div>
            <button
              onClick={handleClearAll}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Очистить все данные
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Удаляет все точки улучшения, диалоги и другие данные. Это действие нельзя отменить.
            </p>
          </div>
        </div>
      </div>

      {/* Диалог импорта */}
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => {
          setShowImportDialog(false);
          setPendingImportData(null);
        }}
        onConfirm={handleImportConfirm}
        importType={importType}
      />
    </div>
  );
}

