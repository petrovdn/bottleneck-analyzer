'use client';

import { useAppStore } from '@/store/useAppStore';
import { 
  MessageCircle, 
  List, 
  FileText, 
  Home,
  ChevronRight,
  LogOut
} from 'lucide-react';

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
  } = useAppStore();

  const hasBottlenecks = bottlenecks.length > 0;
  const hasMultiAgentState = multiAgentState !== null;

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

            {/* Кнопка выхода */}
            <div className="ml-4 pl-4 border-l border-gray-300">
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

