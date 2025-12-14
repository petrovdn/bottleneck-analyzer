'use client';

import { useState, useEffect } from 'react';
import { Bottleneck, DialogState, RefinedBottleneck, BusinessData } from '@/types';
import { 
  ArrowRight, 
  Sparkles, 
  Target, 
  TrendingUp, 
  MessageSquare, 
  FileText,
  CheckCircle,
  Loader2,
  Edit2,
  FileCode,
  Lightbulb
} from 'lucide-react';
import ChatInterface from './ChatInterface';
import { useAppStore } from '@/store/useAppStore';
import { BottleneckForm } from './BottleneckEditor';

interface BottleneckDetailProps {
  bottleneck: Bottleneck;
  businessData: BusinessData;
  dialogState: DialogState | null;
  refinedBottleneck: RefinedBottleneck | undefined;
  isChatLoading: boolean;
  isPromptLoading: boolean;
  onGeneratePrompt: () => void;
  onStartDialog: () => void;
  onSendMessage: (message: string) => void;
  isInitializingDialog: boolean;
}

export default function BottleneckDetail({
  bottleneck,
  businessData,
  dialogState,
  refinedBottleneck,
  isChatLoading,
  isPromptLoading,
  onGeneratePrompt,
  onStartDialog,
  onSendMessage,
  isInitializingDialog,
}: BottleneckDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { updateBottleneck } = useAppStore();
  
  const hasDialogStarted = dialogState !== null;
  const isDialogComplete = dialogState?.isComplete || false;

  // Автоматически запускаем диалог при первом открытии, если он еще не начат
  useEffect(() => {
    if (!hasDialogStarted && !isInitializingDialog) {
      onStartDialog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDialogStarted]);

  const handleSaveEdit = (updatedBottleneck: Bottleneck) => {
    updateBottleneck(bottleneck.id, updatedBottleneck);
    setIsEditing(false);
  };

  // Определяем текущее состояние карточки (обновляется по мере диалога)
  const currentBottleneck = refinedBottleneck || bottleneck;
  
  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Заголовок */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {currentBottleneck.title}
            </h1>
            <p className="text-gray-600 text-sm">
              {currentBottleneck.processArea}
            </p>
            
            {/* Индикатор уточненного решения */}
            {refinedBottleneck && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full w-fit">
                <CheckCircle className="w-4 h-4" />
                Решение уточнено через диалог
              </div>
            )}
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Редактировать улучшение процесса"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Редактор */}
      {isEditing && (
        <div className="bg-white border-b border-gray-200 p-6">
          <BottleneckForm
            bottleneck={currentBottleneck}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      )}
      
      {/* Split view: диалог слева, карточка справа */}
      <div className="flex-1 flex overflow-hidden">
        {/* Левая панель: Диалог */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Диалог с консультантом
            </h2>
          </div>
          <div className="flex-1 p-4 overflow-hidden">
            <ChatInterface
              dialogState={dialogState}
              isLoading={isChatLoading}
              onSendMessage={onSendMessage}
              onStartDialog={onStartDialog}
              isInitializing={isInitializingDialog}
            />
          </div>
        </div>

        {/* Правая панель: Карточка */}
        <div className="w-1/2 bg-white overflow-y-auto">
          <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Карточка улучшения процесса
            </h2>
          </div>
          <div className="p-6">
            <CardContent
              bottleneck={currentBottleneck}
              refinedBottleneck={refinedBottleneck}
              dialogState={dialogState}
              isLoading={isPromptLoading}
              onGeneratePrompt={onGeneratePrompt}
              isDialogComplete={isDialogComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Содержимое карточки
function CardContent({
  bottleneck,
  refinedBottleneck,
  dialogState,
  isLoading,
  onGeneratePrompt,
  isDialogComplete,
}: {
  bottleneck: Bottleneck;
  refinedBottleneck: RefinedBottleneck | undefined;
  dialogState: DialogState | null;
  isLoading: boolean;
  onGeneratePrompt: () => void;
  isDialogComplete: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Описание проблемы */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Описание проблемы</h3>
        <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
          {bottleneck.problemDescription}
        </p>
      </div>

      {/* Метаинформация */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Область процесса</h3>
          </div>
          <p className="text-sm text-gray-700">{bottleneck.processArea}</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-semibold text-gray-900">Текущее влияние</h3>
          </div>
          <p className="text-sm text-gray-700">{bottleneck.currentImpact}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-semibold text-gray-900">Потенциал</h3>
          </div>
          <p className="text-sm text-gray-700">{bottleneck.potentialGain}</p>
        </div>
      </div>

      {/* Инсайты из диалога (если есть) */}
      {dialogState && dialogState.insights.length > 0 && (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-gray-900">Инсайты из диалога</h3>
          </div>
          <ul className="space-y-2">
            {dialogState.insights.map((insight, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* As-Is процесс */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Как сейчас (As-Is)</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {bottleneck.asIsProcess || 'Ожидается уточнение в диалоге...'}
          </p>
        </div>
      </div>

      {/* To-Be процесс */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Предложенное решение (To-Be)</h3>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {refinedBottleneck?.agreedSolution || bottleneck.toBeProcess || 'Ожидается обсуждение в диалоге...'}
          </p>
        </div>
      </div>

      {/* Уточненное решение (если диалог завершен) */}
      {refinedBottleneck && (
        <>
          {refinedBottleneck.processDescription && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Описание нового процесса
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {refinedBottleneck.processDescription}
                </p>
              </div>
            </div>
          )}

          {refinedBottleneck.technicalSpec && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-600" />
                Техническое задание на сервис
              </h3>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                  {refinedBottleneck.technicalSpec}
                </pre>
              </div>
            </div>
          )}
        </>
      )}

      {/* Предложенные агенты */}
      {bottleneck.suggestedAgents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Предложенные агенты</h3>
          <div className="flex flex-wrap gap-2">
            {bottleneck.suggestedAgents.map((agent, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
              >
                {agent}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* MCP инструменты */}
      {bottleneck.mcpToolsNeeded.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Необходимые MCP инструменты</h3>
          <div className="flex flex-wrap gap-2">
            {bottleneck.mcpToolsNeeded.map((tool, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Кнопка генерации промпта */}
      {isDialogComplete && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onGeneratePrompt}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Генерируем промпт...
              </>
            ) : (
              <>
                Сгенерировать промпт для реализации
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          {refinedBottleneck && (
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-2 justify-center">
              <CheckCircle className="w-4 h-4" />
              Промпт будет включать уточнения из диалога
            </p>
          )}
        </div>
      )}
    </div>
  );
}
