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
  ArrowLeft,
  FileCode
} from 'lucide-react';
import ChatInterface from './ChatInterface';
import { useAppStore } from '@/store/useAppStore';
import { BottleneckForm } from './BottleneckEditor';

type ViewMode = 'dialog' | 'card';

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
  const [viewMode, setViewMode] = useState<ViewMode>('dialog');
  const [isEditing, setIsEditing] = useState(false);
  const { updateBottleneck } = useAppStore();
  
  const hasDialogStarted = dialogState !== null;
  const isDialogComplete = dialogState?.isComplete || false;

  // Автоматически запускаем диалог при первом открытии, если он еще не начат
  useEffect(() => {
    if (!hasDialogStarted && viewMode === 'dialog' && !isInitializingDialog) {
      onStartDialog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDialogStarted, viewMode]);

  const handleSaveEdit = (updatedBottleneck: Bottleneck) => {
    updateBottleneck(bottleneck.id, updatedBottleneck);
    setIsEditing(false);
  };
  
  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Заголовок */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {bottleneck.title}
            </h1>
            <p className="text-gray-600 text-sm">
              {bottleneck.processArea}
            </p>
            
            {/* Индикатор уточненного решения */}
            {refinedBottleneck && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full w-fit">
                <CheckCircle className="w-4 h-4" />
                Решение уточнено через диалог
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'dialog' ? (
              <button
                onClick={() => setViewMode('card')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Открыть полную карточку"
              >
                <FileText className="w-4 h-4" />
                Полная карточка
              </button>
            ) : (
              <button
                onClick={() => setViewMode('dialog')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                title="Вернуться к диалогу"
              >
                <MessageSquare className="w-4 h-4" />
                Диалог с агентом
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Редактировать улучшение процесса"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Редактор */}
      {isEditing && (
        <div className="bg-white border-b border-gray-200 p-6">
          <BottleneckForm
            bottleneck={bottleneck}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      )}
      
      {/* Контент: диалог или карточка */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'dialog' ? (
          <DialogView
            dialogState={dialogState}
            isChatLoading={isChatLoading}
            onSendMessage={onSendMessage}
            onStartDialog={onStartDialog}
            isInitializing={isInitializingDialog}
            refinedBottleneck={refinedBottleneck}
            onGeneratePrompt={onGeneratePrompt}
            isPromptLoading={isPromptLoading}
          />
        ) : (
          <CardView
            bottleneck={bottleneck}
            refinedBottleneck={refinedBottleneck}
            isLoading={isPromptLoading}
            onGeneratePrompt={onGeneratePrompt}
            isDialogComplete={isDialogComplete}
            onStartNewDialog={() => {
              setViewMode('dialog');
              onStartDialog();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Представление диалога
function DialogView({
  dialogState,
  isChatLoading,
  onSendMessage,
  onStartDialog,
  isInitializing,
  refinedBottleneck,
  onGeneratePrompt,
  isPromptLoading,
}: {
  dialogState: DialogState | null;
  isChatLoading: boolean;
  onSendMessage: (message: string) => void;
  onStartDialog: () => void;
  isInitializing: boolean;
  refinedBottleneck: RefinedBottleneck | undefined;
  onGeneratePrompt: () => void;
  isPromptLoading: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Диалог */}
      <div className="flex-1 p-4">
        <ChatInterface
          dialogState={dialogState}
          isLoading={isChatLoading}
          onSendMessage={onSendMessage}
          onStartDialog={onStartDialog}
          isInitializing={isInitializing}
        />
      </div>

      {/* Результаты диалога (если завершен) */}
      {refinedBottleneck && (
        <div className="border-t border-gray-200 bg-white p-6 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Результаты диалога
          </h3>
          
          <div className="space-y-6">
            {/* Описание нового процесса */}
            {refinedBottleneck.processDescription && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Описание нового процесса
                </h4>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {refinedBottleneck.processDescription}
                  </p>
                </div>
              </div>
            )}

            {/* Техническое задание */}
            {refinedBottleneck.technicalSpec && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-600" />
                  Техническое задание на сервис
                </h4>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <pre className="text-gray-700 whitespace-pre-wrap leading-relaxed font-sans text-sm">
                    {refinedBottleneck.technicalSpec}
                  </pre>
                </div>
              </div>
            )}

            {/* Кнопка генерации промпта */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={onGeneratePrompt}
                disabled={isPromptLoading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isPromptLoading ? (
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Представление карточки
function CardView({
  bottleneck,
  refinedBottleneck,
  isLoading,
  onGeneratePrompt,
  isDialogComplete,
  onStartNewDialog,
}: {
  bottleneck: Bottleneck;
  refinedBottleneck: RefinedBottleneck | undefined;
  isLoading: boolean;
  onGeneratePrompt: () => void;
  isDialogComplete: boolean;
  onStartNewDialog: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        {/* Описание проблемы */}
        <div className="mb-8">
          <p className="text-lg text-gray-700 leading-relaxed">
            {bottleneck.problemDescription}
          </p>
        </div>

        {/* Метаинформация */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Область процесса</h3>
            </div>
            <p className="text-sm text-gray-600">{bottleneck.processArea}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-gray-900">Текущее влияние</h3>
            </div>
            <p className="text-sm text-gray-600">{bottleneck.currentImpact}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Потенциал</h3>
            </div>
            <p className="text-sm text-gray-600">{bottleneck.potentialGain}</p>
          </div>
        </div>

        {/* Уточненное решение (если есть) */}
        {refinedBottleneck && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              Согласованное решение
            </h2>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-lg shadow-sm border-2 border-emerald-200">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed mb-4">
                {refinedBottleneck.agreedSolution}
              </p>
              
              {refinedBottleneck.dialogSummary && (
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <h4 className="font-semibold text-emerald-800 mb-2">Резюме диалога:</h4>
                  <p className="text-sm text-emerald-700">
                    {refinedBottleneck.dialogSummary}
                  </p>
                </div>
              )}

              {/* Описание нового процесса */}
              {refinedBottleneck.processDescription && (
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <h4 className="font-semibold text-emerald-800 mb-2">Описание нового процесса:</h4>
                  <p className="text-sm text-emerald-700 whitespace-pre-line">
                    {refinedBottleneck.processDescription}
                  </p>
                </div>
              )}

              {/* Техническое задание */}
              {refinedBottleneck.technicalSpec && (
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <h4 className="font-semibold text-emerald-800 mb-2">Техническое задание:</h4>
                  <pre className="text-sm text-emerald-700 whitespace-pre-wrap font-sans">
                    {refinedBottleneck.technicalSpec}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* As-Is процесс */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Как сейчас (As-Is)
          </h2>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {bottleneck.asIsProcess}
            </p>
          </div>
        </div>

        {/* To-Be процесс */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Предложенное решение (To-Be)
          </h2>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg shadow-sm border-2 border-green-200">
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {refinedBottleneck?.agreedSolution || bottleneck.toBeProcess}
            </p>
          </div>
        </div>

        {/* Предложенные агенты */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Предложенные агенты
          </h2>
          <div className="flex flex-wrap gap-2">
            {bottleneck.suggestedAgents.map((agent, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {agent}
              </span>
            ))}
          </div>
        </div>

        {/* MCP инструменты */}
        {bottleneck.mcpToolsNeeded.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Необходимые MCP инструменты
            </h2>
            <div className="flex flex-wrap gap-2">
              {bottleneck.mcpToolsNeeded.map((tool, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex flex-col items-center gap-3">
          {!isDialogComplete && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
              <p className="text-blue-800 text-sm flex items-start gap-2 mb-3">
                <MessageSquare className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Совет:</strong> Начните диалог с ИИ-консультантом, чтобы детально 
                  разобрать текущий процесс и спроектировать улучшенный процесс.
                </span>
              </p>
              <button
                onClick={onStartNewDialog}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                Начать диалог с агентом
              </button>
            </div>
          )}

          {isDialogComplete && (
            <button
              onClick={onStartNewDialog}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Начать новый диалог
            </button>
          )}

          <button
            onClick={onGeneratePrompt}
            disabled={isLoading}
            className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-8 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg"
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
            <p className="text-sm text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Промпт будет включать уточнения из диалога
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
