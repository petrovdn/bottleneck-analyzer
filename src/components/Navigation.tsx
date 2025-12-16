'use client';

import { useAppStore } from '@/store/useAppStore';
import { 
  MessageCircle, 
  List, 
  FileText, 
  Home,
  ChevronRight,
  LogOut,
  Database,
  Download,
  Upload,
  ChevronDown
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navigation() {
  const {
    viewMode,
    stage,
    navigateToMultiAgent,
    navigateToBottlenecksList,
    navigateToBottleneckDetail,
    selectedBottleneck,
    bottlenecks,
    multiAgentState,
    setStage,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    setViewMode,
  } = useAppStore();

  const [showDataMenu, setShowDataMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasBottlenecks = bottlenecks.length > 0;
  const hasMultiAgentState = multiAgentState !== null;

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDataMenu(false);
      }
    };

    if (showDataMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDataMenu]);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Логотип/Название */}
          <div className="flex items-center">
            <Home className="w-6 h-6 text-blue-600 mr-2" />
            <span className="text-xl font-bold text-gray-900">Повышение результативности и эффективности работы</span>
          </div>

          {/* Навигационные ссылки */}
          <div className="flex items-center space-x-1">
            {/* Мультиагентный диалог */}
            <button
              onClick={navigateToMultiAgent}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'multi_agent_dialog'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Вернуться к диалогу с мультиагентной системой"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Диалог</span>
              {hasMultiAgentState && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-200 text-blue-700 rounded-full">
                  Активен
                </span>
              )}
            </button>

            {/* Список точек улучшения */}
            <button
              onClick={() => {
                // Проверяем несохраненные изменения
                if (hasUnsavedChanges && (viewMode === 'bottleneck_detail' || viewMode === 'bottlenecks_list')) {
                  const userChoice = confirm('У вас есть несохраненные изменения. Сохранить перед переходом к списку?\n\nНажмите OK для сохранения, Отмена - чтобы перейти без сохранения.');
                  if (userChoice) {
                    // Пользователь хочет сохранить - показываем инструкцию
                    alert('Пожалуйста, нажмите кнопку "Сохранить" в форме перед переходом.');
                    return; // Не переходим, ждем сохранения
                  } else {
                    // Пользователь решил не сохранять - сбрасываем флаг и переходим
                    setHasUnsavedChanges(false);
                  }
                }
                
                if (stage === 'discovery') {
                  setStage('bottlenecks');
                }
                navigateToBottlenecksList();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'bottlenecks_list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Перейти к списку точек улучшения"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Точки улучшения</span>
              {hasBottlenecks && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                  {bottlenecks.length}
                </span>
              )}
            </button>

            {/* Детали текущей точки улучшения */}
            {selectedBottleneck && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => navigateToBottleneckDetail(selectedBottleneck.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'bottleneck_detail'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={`Детали: ${selectedBottleneck.title}`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline max-w-xs truncate">
                    {selectedBottleneck.title}
                  </span>
                </button>
              </>
            )}

            {/* Меню "Данные" */}
            <div className="ml-4 pl-4 border-l border-gray-300 relative" ref={menuRef}>
              <button
                onClick={() => setShowDataMenu(!showDataMenu)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'data_management'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Управление данными"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Данные</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDataMenu ? 'rotate-180' : ''}`} />
              </button>

              {showDataMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      setViewMode('data_management');
                      setShowDataMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Database className="w-4 h-4 text-gray-500" />
                    <span>Управление данными</span>
                  </button>
                </div>
              )}
            </div>

            {/* Кнопка выхода */}
            <div className="ml-2 pl-2 border-l border-gray-300">
              <button
                onClick={() => {
                  if (confirm('Вы уверены, что хотите выйти?')) {
                    localStorage.removeItem('isAuthenticated');
                    localStorage.removeItem('authTimestamp');
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 hover:text-red-600"
                title="Выйти из системы"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Выход</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

