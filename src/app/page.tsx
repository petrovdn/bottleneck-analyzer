'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import DiscoveryForm from '@/components/DiscoveryForm';
import BottlenecksList from '@/components/BottlenecksList';
import BottleneckDetail from '@/components/BottleneckDetail';
import PromptDisplay from '@/components/PromptDisplay';
import MultiAgentChat from '@/components/MultiAgentChat';
import Navigation from '@/components/Navigation';
import BottleneckEditor from '@/components/BottleneckEditor';
import { BusinessData } from '@/types';

export default function Home() {
  const {
    stage,
    businessData,
    bottlenecks,
    selectedBottleneck,
    refinedBottlenecks,
    generatedPrompt,
    isLoading,
    error,
    dialogState,
    isChatLoading,
    multiAgentState,
    isMultiAgentLoading,
    viewMode,
    setStage,
    setBusinessData,
    setBottlenecks,
    setSelectedBottleneck,
    setGeneratedPrompt,
    setLoading,
    setError,
    setDialogState,
    setChatLoading,
    addRefinedBottleneck,
    getRefinedBottleneck,
    setMultiAgentState,
    setMultiAgentLoading,
    navigateToMultiAgent,
    navigateToBottlenecksList,
    navigateToBottleneckDetail,
  } = useAppStore();

  const [isInitializingDialog, setIsInitializingDialog] = useState(false);
  const [isInitializingMultiAgent, setIsInitializingMultiAgent] = useState(false);
  const { loadState } = useAppStore();

  // Загружаем сохраненное состояние при монтировании
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Автоматически выбрать первое узкое место, если нет выбранного
  useEffect(() => {
    if (bottlenecks.length > 0 && !selectedBottleneck && viewMode === 'bottlenecks_list') {
      // Не выбираем автоматически, если пользователь явно на списке
    }
  }, [bottlenecks, selectedBottleneck, viewMode]);

  const handleDiscoverySubmit = async (data: BusinessData) => {
    setBusinessData(data);
    // Переходим к мультиагентной системе
    setStage('bottlenecks');
  };

  // Инициализация мультиагентной системы
  const handleInitializeMultiAgent = async () => {
    if (!businessData) return;

    setIsInitializingMultiAgent(true);
    setError(null);

    try {
      const response = await fetch('/api/multi-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize multi-agent system');
      }

      const result = await response.json();
      setMultiAgentState(result.multiAgentState);
    } catch (err: any) {
      setError(err.message);
      console.error('Error initializing multi-agent:', err);
    } finally {
      setIsInitializingMultiAgent(false);
    }
  };

  // Отправка сообщения в мультиагентную систему
  const handleSendMultiAgentMessage = async (message: string) => {
    if (!businessData || !multiAgentState) return;

    setMultiAgentLoading(true);
    setError(null);

    // Оптимистично обновляем состояние - добавляем ответ пользователя с временной меткой
    const answerKey = `answer_${Object.keys(multiAgentState.collectedAnswers).length + 1}`;
    const answerTimestamp = new Date().toISOString();
    const optimisticState = {
      ...multiAgentState,
      collectedAnswers: {
        ...multiAgentState.collectedAnswers,
        [answerKey]: {
          answer: message,
          timestamp: answerTimestamp,
        },
      },
    };
    setMultiAgentState(optimisticState);

    try {
      const response = await fetch('/api/multi-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessData,
          userMessage: message,
          multiAgentState,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process message');
      }

      const result = await response.json();
      
      // Обновляем состояние с ответом от сервера
      setMultiAgentState(result.multiAgentState);

      // Если найдены узкие места, обновляем список
      if (result.bottlenecks && result.bottlenecks.length > 0) {
        setBottlenecks(result.bottlenecks);
        if (!selectedBottleneck && result.bottlenecks.length > 0) {
          setSelectedBottleneck(result.bottlenecks[0]);
        }
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error sending message:', err);
      // В случае ошибки возвращаем предыдущее состояние
      setMultiAgentState(multiAgentState);
    } finally {
      setMultiAgentLoading(false);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!selectedBottleneck || !businessData) return;

    setLoading(true);
    setError(null);

    // Проверяем есть ли уточненная версия
    const refined = getRefinedBottleneck(selectedBottleneck.id);

    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessData,
          bottleneck: selectedBottleneck,
          refinedBottleneck: refined, // Передаем уточненную версию если есть
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate prompt');
      }

      const result = await response.json();
      setGeneratedPrompt(result.prompt);
      setStage('prompt');
    } catch (err: any) {
      setError(err.message);
      console.error('Error generating prompt:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToBottlenecks = () => {
    setStage('bottlenecks');
    setGeneratedPrompt('');
  };

  // Начать диалог с агентом
  const handleStartDialog = async () => {
    if (!selectedBottleneck || !businessData) return;

    setIsInitializingDialog(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessData,
          bottleneck: selectedBottleneck,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize dialog');
      }

      const result = await response.json();
      setDialogState(result.dialogState);
    } catch (err: any) {
      setError(err.message);
      console.error('Error initializing dialog:', err);
    } finally {
      setIsInitializingDialog(false);
    }
  };

  // Отправить сообщение в диалог
  const handleSendMessage = async (message: string) => {
    if (!selectedBottleneck || !businessData || !dialogState) return;

    setChatLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessData,
          bottleneck: selectedBottleneck,
          dialogState,
          userMessage: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const result = await response.json();
      setDialogState(result.updatedDialogState);

      // Если диалог завершен и есть уточненное решение
      if (result.refinedBottleneck) {
        addRefinedBottleneck(selectedBottleneck.id, result.refinedBottleneck);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error sending message:', err);
    } finally {
      setChatLoading(false);
    }
  };

  // Получить уточненное узкое место для текущего выбранного
  const currentRefinedBottleneck = selectedBottleneck 
    ? getRefinedBottleneck(selectedBottleneck.id) 
    : undefined;

  // Экран 1: Discovery
  if (stage === 'discovery') {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <DiscoveryForm onSubmit={handleDiscoverySubmit} isLoading={isLoading} />
        </div>
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
            {error}
          </div>
        )}
      </>
    );
  }

  // Экран 2: Bottlenecks
  if (stage === 'bottlenecks') {
    return (
      <>
        <Navigation />
        <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
          {/* Мультиагентный диалог */}
          {viewMode === 'multi_agent_dialog' && (
            <div className="flex-1">
              {!multiAgentState && businessData ? (
                <MultiAgentChat
                  multiAgentState={null}
                  isLoading={false}
                  onSendMessage={handleSendMultiAgentMessage}
                  onInitialize={handleInitializeMultiAgent}
                  isInitializing={isInitializingMultiAgent}
                />
              ) : multiAgentState ? (
                <MultiAgentChat
                  multiAgentState={multiAgentState}
                  isLoading={isMultiAgentLoading}
                  onSendMessage={handleSendMultiAgentMessage}
                  onInitialize={handleInitializeMultiAgent}
                  isInitializing={isInitializingMultiAgent}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Сначала заполните форму анализа</p>
                </div>
              )}
            </div>
          )}

          {/* Список узких мест */}
          {viewMode === 'bottlenecks_list' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Узкие места</h2>
                  <p className="text-gray-600">Управление узкими местами</p>
                </div>
                <BottleneckEditor />
              </div>
            </div>
          )}

          {/* Детали узкого места */}
          {viewMode === 'bottleneck_detail' && selectedBottleneck && businessData && (
            <div className="flex-1 overflow-hidden">
              <BottleneckDetail
                bottleneck={selectedBottleneck}
                businessData={businessData}
                dialogState={dialogState}
                refinedBottleneck={currentRefinedBottleneck}
                isChatLoading={isChatLoading}
                isPromptLoading={isLoading}
                onGeneratePrompt={handleGeneratePrompt}
                onStartDialog={handleStartDialog}
                onSendMessage={handleSendMessage}
                isInitializingDialog={isInitializingDialog}
              />
            </div>
          )}

          {/* Если нет выбранного режима, показываем список */}
          {viewMode !== 'multi_agent_dialog' && 
           viewMode !== 'bottlenecks_list' && 
           viewMode !== 'bottleneck_detail' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto">
                <BottleneckEditor />
              </div>
            </div>
          )}
        </div>
        {error && (
          <div className="fixed top-20 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md z-50">
            <button 
              onClick={() => setError(null)}
              className="float-right ml-2 font-bold"
            >
              ×
            </button>
            {error}
          </div>
        )}
      </>
    );
  }

  // Экран 3: Prompt
  if (stage === 'prompt') {
    return <PromptDisplay prompt={generatedPrompt} onBack={handleBackToBottlenecks} />;
  }

  return null;
}


