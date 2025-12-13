'use client';

import { useAppStore } from '@/store/useAppStore';
import { 
  MessageCircle, 
  List, 
  FileText, 
  Home,
  ChevronRight
} from 'lucide-react';

export default function Navigation() {
  const {
    viewMode,
    navigateToMultiAgent,
    navigateToBottlenecksList,
    navigateToBottleneckDetail,
    selectedBottleneck,
    bottlenecks,
    multiAgentState,
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
            <span className="text-xl font-bold text-gray-900">Анализ узких мест</span>
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

            {/* Список узких мест */}
            <button
              onClick={navigateToBottlenecksList}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'bottlenecks_list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              disabled={!hasBottlenecks}
              title="Перейти к списку узких мест"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Узкие места</span>
              {hasBottlenecks && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                  {bottlenecks.length}
                </span>
              )}
            </button>

            {/* Детали текущего узкого места */}
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
          </div>
        </div>
      </div>
    </nav>
  );
}

