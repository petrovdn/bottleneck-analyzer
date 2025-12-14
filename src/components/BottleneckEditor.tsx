'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Bottleneck, Priority, FieldSuggestion, BusinessData, DialogState } from '@/types';
import { Plus, Trash2, Edit2, X, Save, Loader2, MessageCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ChatInterface from './ChatInterface';
import FieldSuggestions from './FieldSuggestions';

interface BottleneckEditorProps {
  bottleneck?: Bottleneck;
  onSave?: (bottleneck: Bottleneck) => void;
  onCancel?: () => void;
  businessData?: BusinessData;
  suggestions?: FieldSuggestion[];
  onApplySuggestion?: (suggestion: FieldSuggestion) => void;
  onDismissSuggestion?: (suggestion: FieldSuggestion) => void;
}

// Карточка точки улучшения (только просмотр, заполняется автоматически)
export function BottleneckForm({ 
  bottleneck, 
  suggestions = [],
  onApplySuggestion,
  onDismissSuggestion,
}: BottleneckEditorProps) {

  // Обработка применения предложения - теперь просто передаем в родительский компонент
  const handleApplySuggestion = (suggestion: FieldSuggestion) => {
    onApplySuggestion?.(suggestion);
  };

  // Используем данные напрямую из bottleneck (форма только для просмотра)
  const displayData = bottleneck || {
    title: '',
    processArea: '',
    problemDescription: '',
    currentImpact: '',
    priority: 'medium' as Priority,
    potentialGain: '',
    asIsProcess: '',
    toBeProcess: '',
    suggestedAgents: [],
    mcpToolsNeeded: [],
  };

  return (
    <div className="space-y-4">
      {/* Показываем предложения для всех полей */}
      {suggestions.length > 0 && (
        <FieldSuggestions
          suggestions={suggestions}
          onApply={handleApplySuggestion}
          onDismiss={onDismissSuggestion || (() => {})}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название
          </label>
          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
            {displayData.title || <span className="text-gray-400">Не заполнено</span>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Область процесса
          </label>
          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
            {displayData.processArea || <span className="text-gray-400">Не заполнено</span>}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Описание проблемы
        </label>
        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 min-h-[80px]">
          {displayData.problemDescription || <span className="text-gray-400">Не заполнено</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Текущее влияние
          </label>
          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 min-h-[60px]">
            {displayData.currentImpact || <span className="text-gray-400">Не заполнено</span>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Приоритет
          </label>
          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
            {displayData.priority === 'high' ? 'Высокий' : 
             displayData.priority === 'medium' ? 'Средний' : 
             displayData.priority === 'low' ? 'Низкий' : 'Не указано'}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Потенциальный выигрыш
        </label>
        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 min-h-[60px]">
          {displayData.potentialGain || <span className="text-gray-400">Не заполнено</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Текущий процесс (as-is)
          </label>
          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 min-h-[80px]">
            {displayData.asIsProcess || <span className="text-gray-400">Не заполнено</span>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Целевой процесс (to-be)
          </label>
          <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 min-h-[80px]">
            {displayData.toBeProcess || <span className="text-gray-400">Не заполнено</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Основной компонент редактора с split view
interface BottleneckEditorMainProps {
  bottleneck?: Bottleneck;
  onSave?: (bottleneck: Bottleneck) => void;
  onCancel?: () => void;
  businessData?: BusinessData;
}

export default function BottleneckEditor(props?: BottleneckEditorMainProps) {
  const {
    bottlenecks,
    selectedBottleneck,
    addBottleneck,
    updateBottleneck,
    deleteBottleneck,
    navigateToBottlenecksList,
    businessData: storeBusinessData,
    dialogState: storeDialogState,
    setDialogState,
    setChatLoading,
    isChatLoading,
    setHasUnsavedChanges,
    hasUnsavedChanges,
  } = useAppStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fieldSuggestions, setFieldSuggestions] = useState<FieldSuggestion[]>([]);
  const [isInitializingDialog, setIsInitializingDialog] = useState(false);
  const [currentBottleneck, setCurrentBottleneck] = useState<Bottleneck | undefined>(props?.bottleneck);
  const [dialogState, setLocalDialogState] = useState<DialogState | null>(null);

  const businessData = props?.businessData || storeBusinessData || {
    productDescription: 'Не указано',
    teamSize: 0,
    workflows: 'Не указано',
    kpis: 'Не указано',
  };

  // Синхронизируем storeDialogState с localDialogState при обновлении store
  useEffect(() => {
    if (!storeDialogState) return;
    
    const targetBottleneck = props?.bottleneck || 
                            (editingId ? bottlenecks.find(b => b.id === editingId) : null);
    
    if (targetBottleneck && storeDialogState.bottleneckId === targetBottleneck.id) {
      setLocalDialogState(prevState => {
        // Обновляем только если storeDialogState новее (больше сообщений)
        if (!prevState || storeDialogState.messages.length > prevState.messages.length) {
          return storeDialogState;
        }
        return prevState;
      });
    }
  }, [storeDialogState?.bottleneckId, storeDialogState?.messages.length]);
  
  // Загружаем существующий диалог при открытии точки улучшения (только при первой загрузке)
  useEffect(() => {
    const targetBottleneck = props?.bottleneck || 
                            (editingId ? bottlenecks.find(b => b.id === editingId) : null);
    
    if (!targetBottleneck) {
      return;
    }
    
    // Используем функциональное обновление, чтобы проверить текущее состояние
    setLocalDialogState(prevState => {
      // Если уже есть локальный dialogState для этого bottleneck, не перезаписываем
      if (prevState && prevState.bottleneckId === targetBottleneck.id) {
        return prevState;
      }
      
      // Если есть storeDialogState для этого bottleneck, используем его
      if (storeDialogState && storeDialogState.bottleneckId === targetBottleneck.id) {
        return storeDialogState;
      }
      
      // Нет существующего диалога - возвращаем null (будет создан по кнопке)
      return null;
    });
  }, [props?.bottleneck?.id, editingId]);

  // Инициализация диалога
  const handleStartDialog = async (bottleneck: Bottleneck) => {
    if (!businessData) {
      console.error('Business data is missing');
      return;
    }

    console.log('Starting dialog initialization for bottleneck:', bottleneck.id);
    setIsInitializingDialog(true);
    try {
      const response = await fetch('/api/chat/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessData,
          bottleneck,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to initialize dialog:', response.status, errorText);
        throw new Error(`Failed to initialize dialog: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Dialog initialization result:', result);
      
      if (!result.dialogState) {
        console.error('No dialogState in response:', result);
        throw new Error('Invalid response: dialogState is missing');
      }
      
      const newDialogState = result.dialogState;
      console.log('Setting dialog state:', newDialogState);
      console.log('Messages in dialog state:', newDialogState.messages?.length, newDialogState.messages);
      
      // Устанавливаем состояние синхронно
      setLocalDialogState(newDialogState);
      setDialogState(newDialogState);
      
      // Проверяем, что состояние установилось
      setTimeout(() => {
        console.log('Dialog state after set:', dialogState);
      }, 100);
    } catch (err) {
      console.error('Error initializing dialog:', err);
      alert(`Ошибка при инициализации диалога: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsInitializingDialog(false);
    }
  };

  // Отправка сообщения в диалог
  const handleSendMessage = async (message: string) => {
    let targetBottleneck: Bottleneck | null = null;
    
    if (isCreating) {
      // Для новой точки улучшения используем временный объект
      targetBottleneck = {
        id: `temp_${uuidv4()}`,
        title: '',
        processArea: '',
        problemDescription: '',
        currentImpact: '',
        priority: 'medium',
        potentialGain: '',
        asIsProcess: '',
        toBeProcess: '',
        suggestedAgents: [],
        mcpToolsNeeded: [],
      };
    } else {
      targetBottleneck = currentBottleneck || (editingId ? bottlenecks.find(b => b.id === editingId) || null : null);
    }
    
    if (!targetBottleneck || !businessData || !dialogState) return;

    setChatLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessData,
          bottleneck: targetBottleneck,
          dialogState,
          userMessage: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      const updatedDialogState = result.updatedDialogState;
      setLocalDialogState(updatedDialogState);
      setDialogState(updatedDialogState);

      // Автоматически обновляем bottleneck, если есть обновления от агента
      if (result.updatedBottleneck && targetBottleneck) {
        // Если это новое улучшение (временный ID), создаем его в store
        if (isCreating && targetBottleneck.id.startsWith('temp_')) {
          const newBottleneck: Bottleneck = {
            id: `bottleneck_${uuidv4()}`,
            title: result.updatedBottleneck.title || targetBottleneck.title || 'Без названия',
            processArea: result.updatedBottleneck.processArea || targetBottleneck.processArea || '',
            problemDescription: result.updatedBottleneck.problemDescription || targetBottleneck.problemDescription || '',
            currentImpact: result.updatedBottleneck.currentImpact || targetBottleneck.currentImpact || '',
            priority: (result.updatedBottleneck.priority as Priority) || targetBottleneck.priority || 'medium',
            potentialGain: result.updatedBottleneck.potentialGain || targetBottleneck.potentialGain || '',
            asIsProcess: result.updatedBottleneck.asIsProcess || targetBottleneck.asIsProcess || '',
            toBeProcess: result.updatedBottleneck.toBeProcess || targetBottleneck.toBeProcess || '',
            suggestedAgents: [],
            mcpToolsNeeded: [],
          };
          
          // Сохраняем только если есть хотя бы title или problemDescription
          if (newBottleneck.title !== 'Без названия' || newBottleneck.problemDescription) {
            addBottleneck(newBottleneck);
            setIsCreating(false);
            setEditingId(newBottleneck.id);
            setCurrentBottleneck(newBottleneck);
            
            // Обновляем dialogState с новым ID
            if (updatedDialogState) {
              const updatedDialogStateWithNewId = {
                ...updatedDialogState,
                bottleneckId: newBottleneck.id,
              };
              setLocalDialogState(updatedDialogStateWithNewId);
              setDialogState(updatedDialogStateWithNewId);
            }
          } else {
            // Обновляем временный bottleneck
            setCurrentBottleneck({ ...targetBottleneck, ...result.updatedBottleneck });
          }
        } else {
          // Обновляем существующее улучшение
          updateBottleneck(targetBottleneck.id, result.updatedBottleneck);
          
          // Обновляем локальное состояние
          if (editingId) {
            const updated = bottlenecks.find(b => b.id === editingId);
            if (updated) {
              setCurrentBottleneck({ ...updated, ...result.updatedBottleneck });
            }
          } else if (currentBottleneck) {
            setCurrentBottleneck({ ...currentBottleneck, ...result.updatedBottleneck });
          }
        }
      }

      // Обрабатываем предложения изменений
      if (result.fieldSuggestions && result.fieldSuggestions.length > 0) {
        setFieldSuggestions(prev => {
          // Фильтруем дубликаты по полю
          const existingFields = new Set(prev.map(s => s.field));
          const newSuggestions = result.fieldSuggestions.filter(
            (s: FieldSuggestion) => !existingFields.has(s.field)
          );
          return [...prev, ...newSuggestions];
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setChatLoading(false);
    }
  };

  // Применение предложения - автоматически обновляем bottleneck
  const handleApplySuggestion = (suggestion: FieldSuggestion) => {
    const targetBottleneck = props?.bottleneck || 
                            (editingId ? bottlenecks.find(b => b.id === editingId) : null) ||
                            currentBottleneck;
    
    if (!targetBottleneck) return;
    
    try {
      const field = suggestion.field;
      let newValue: any = suggestion.suggestedValue;
      
      // Парсим JSON для массивов (хотя мы убрали эти поля, но на всякий случай)
      if (field === 'suggestedAgents' || field === 'mcpToolsNeeded') {
        try {
          newValue = JSON.parse(suggestion.suggestedValue);
        } catch {
          newValue = suggestion.suggestedValue.split(',').map(s => s.trim()).filter(s => s);
        }
      }
      
      // Обрабатываем приоритет
      if (field === 'priority') {
        const validPriorities: Priority[] = ['high', 'medium', 'low'];
        if (validPriorities.includes(newValue as Priority)) {
          newValue = newValue as Priority;
        } else {
          console.warn('Invalid priority value:', newValue);
          return;
        }
      }
      
      // Обновляем bottleneck в store
      updateBottleneck(targetBottleneck.id, { [field]: newValue } as Partial<Bottleneck>);
      
      // Обновляем локальное состояние
      if (editingId) {
        const updated = bottlenecks.find(b => b.id === editingId);
        if (updated) {
          setCurrentBottleneck(updated);
        }
      }
      
      // Убираем предложение из списка
      setFieldSuggestions(prev => prev.filter(s => 
        !(s.field === suggestion.field && s.suggestedValue === suggestion.suggestedValue)
      ));
    } catch (e) {
      console.error('Error applying suggestion:', e);
    }
  };

  // Отклонение предложения
  const handleDismissSuggestion = (suggestion: FieldSuggestion) => {
    setFieldSuggestions(prev => prev.filter(s => 
      !(s.field === suggestion.field && s.suggestedValue === suggestion.suggestedValue)
    ));
  };

  // Если передан bottleneck через props, работаем в режиме редактирования с split view
  if (props?.bottleneck || editingId || isCreating) {
    let targetBottleneck: Bottleneck | undefined = props?.bottleneck || 
                            (editingId ? bottlenecks.find(b => b.id === editingId) : undefined);
    
    // Для нового улучшения создаем временный объект
    if (isCreating && !targetBottleneck) {
      targetBottleneck = {
        id: `temp_${uuidv4()}`,
        title: '',
        processArea: '',
        problemDescription: '',
        currentImpact: '',
        priority: 'medium',
        potentialGain: '',
        asIsProcess: '',
        toBeProcess: '',
        suggestedAgents: [],
        mcpToolsNeeded: [],
      };
    }

    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Верхняя панель: Диалог с агентом (с скроллом) */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 flex flex-col" style={{ flexBasis: '40%', minHeight: '300px', maxHeight: '50%' }}>
          <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Диалог с консультантом</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Общайтесь с агентом, чтобы улучшить описание точки улучшения
                </p>
              </div>
              {!dialogState && targetBottleneck && (
                <button
                  onClick={() => targetBottleneck && handleStartDialog(targetBottleneck)}
                  disabled={isInitializingDialog}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isInitializingDialog ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Запуск...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      Начать диалог
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <ChatInterface
              dialogState={dialogState}
              isLoading={isChatLoading}
              onSendMessage={handleSendMessage}
              onStartDialog={() => targetBottleneck && handleStartDialog(targetBottleneck)}
              isInitializing={isInitializingDialog}
            />
          </div>
        </div>

        {/* Нижняя панель: Карточка улучшения процесса (только просмотр, заполняется автоматически) */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden min-h-0">
          <div className="flex-shrink-0 p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isCreating ? 'Создать новое улучшение процесса' : 'Карточка улучшения процесса'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Карточка заполняется автоматически по мере диалога. Для изменения полей попросите об этом агента.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                  setCurrentBottleneck(undefined);
                  setLocalDialogState(null);
                  setDialogState(null);
                  setFieldSuggestions([]);
                  setHasUnsavedChanges(false);
                  props?.onCancel?.();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <BottleneckForm
                bottleneck={targetBottleneck}
                businessData={businessData || undefined}
                suggestions={fieldSuggestions}
                onApplySuggestion={handleApplySuggestion}
                onDismissSuggestion={handleDismissSuggestion}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = (bottleneckId: string) => {
    if (confirm('Вы уверены, что хотите удалить это улучшение процесса?')) {
      deleteBottleneck(bottleneckId);
      if (selectedBottleneck?.id === bottleneckId) {
        navigateToBottlenecksList();
      }
    }
  };

  const handleEdit = (bottleneckId: string) => {
    const bottleneck = bottlenecks.find(b => b.id === bottleneckId);
    if (bottleneck) {
      setEditingId(bottleneckId);
      setCurrentBottleneck(bottleneck);
      setFieldSuggestions([]);
      // Существующий диалог загрузится автоматически через useEffect, если он есть
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setCurrentBottleneck(undefined);
    setFieldSuggestions([]);
    setLocalDialogState(null);
    setDialogState(null);
  };

  return (
    <div className="space-y-4">
      {/* Кнопка создания */}
      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Создать улучшение процесса
        </button>
      </div>

      {/* Список точек улучшения с кнопками управления */}
      <div className="space-y-2">
        {bottlenecks.map((bottleneck) => (
          <div
            key={bottleneck.id}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{bottleneck.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{bottleneck.processArea}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(bottleneck.id)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Редактировать"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(bottleneck.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

