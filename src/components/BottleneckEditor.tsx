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
      {/* Предложения больше не показываются - они применяются автоматически */}
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
  const justInitializedDialogRef = useRef(false);
  const hasLoadedDialogRef = useRef<string>('');

  const businessData = props?.businessData || storeBusinessData || {
    productDescription: 'Не указано',
    teamSize: 0,
    workflows: 'Не указано',
    kpis: 'Не указано',
  };

  // При монтировании компонента проверяем, есть ли dialogState в store для текущего bottleneck
  useEffect(() => {
    const targetBottleneck = props?.bottleneck || 
                            (editingId ? bottlenecks.find(b => b.id === editingId) : null);
    
    if (!targetBottleneck) return;
    
    // Проверяем localStorage напрямую (только в браузере)
    if (typeof window !== 'undefined') {
      try {
        const storageKey = 'bottleneck-analyzer-storage';
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          console.log('=== localStorage data:', {
            hasDialogState: !!parsed.state?.dialogState,
            dialogStateBottleneckId: parsed.state?.dialogState?.bottleneckId,
            dialogStateMessagesCount: parsed.state?.dialogState?.messages?.length || 0,
          });
        } else {
          console.log('=== No data in localStorage');
        }
      } catch (e) {
        console.error('Error reading localStorage:', e);
      }
    }
    
    // Проверяем store напрямую на случай, если storeDialogState еще не обновился
    const currentStoreState = useAppStore.getState();
    const dialogStateInStore = currentStoreState.dialogState;
    
    console.log('=== Mount check:', {
      targetBottleneckId: targetBottleneck.id,
      dialogStateInStore: dialogStateInStore ? `ID: ${dialogStateInStore.bottleneckId}, Messages: ${dialogStateInStore.messages.length}` : 'null',
      currentLocalDialogState: dialogState ? `ID: ${dialogState.bottleneckId}, Messages: ${dialogState.messages.length}` : 'null',
    });
    
    if (dialogStateInStore && dialogStateInStore.bottleneckId === targetBottleneck.id && dialogStateInStore.messages.length > 0) {
      if (!dialogState || dialogState.bottleneckId !== targetBottleneck.id || dialogState.messages.length === 0) {
        console.log('Mount: Loading dialog from store on mount:', dialogStateInStore.messages.length, 'messages');
        setLocalDialogState(dialogStateInStore);
      }
    }
  }, []); // Только при монтировании

  // Единый useEffect для загрузки диалога при открытии bottleneck
  useEffect(() => {
    // Пропускаем загрузку, если диалог инициализируется
    if (isInitializingDialog || justInitializedDialogRef.current) {
      if (justInitializedDialogRef.current) {
        setTimeout(() => {
          justInitializedDialogRef.current = false;
        }, 500);
      }
      return;
    }
    
    const targetBottleneck = props?.bottleneck || 
                            (editingId ? bottlenecks.find(b => b.id === editingId) : null);
    
    if (!targetBottleneck) {
      return;
    }
    
    // Проверяем, загружали ли мы уже диалог для этого bottleneck
    const dialogKey = `${targetBottleneck.id}-${editingId || props?.bottleneck?.id}`;
    if (hasLoadedDialogRef.current === dialogKey && dialogState && dialogState.bottleneckId === targetBottleneck.id) {
      return; // Уже загружен
    }
    
    console.log('=== Loading dialog for bottleneck:', targetBottleneck.id);
    console.log('storeDialogState:', storeDialogState ? `ID: ${storeDialogState.bottleneckId}, Messages: ${storeDialogState.messages.length}` : 'null');
    console.log('current localDialogState:', dialogState ? `ID: ${dialogState.bottleneckId}, Messages: ${dialogState.messages.length}` : 'null');
    
    // Если уже есть правильный локальный dialogState - не меняем его
    if (dialogState && dialogState.bottleneckId === targetBottleneck.id && dialogState.messages.length > 0) {
      console.log('✓ Already have correct local dialog state:', dialogState.messages.length, 'messages');
      hasLoadedDialogRef.current = dialogKey;
      return;
    }
    
    // Если есть storeDialogState для этого bottleneck с сообщениями - загружаем его
    if (storeDialogState && storeDialogState.bottleneckId === targetBottleneck.id && storeDialogState.messages.length > 0) {
      console.log('✓ Loading dialog from store:', storeDialogState.messages.length, 'messages');
      setLocalDialogState(storeDialogState);
      hasLoadedDialogRef.current = dialogKey;
      return;
    }
    
    // Если storeDialogState для другого bottleneck - сбрасываем локальное
    if (storeDialogState && storeDialogState.bottleneckId !== targetBottleneck.id) {
      console.log('✗ Store dialog is for different bottleneck, clearing local state');
      setLocalDialogState(null);
      hasLoadedDialogRef.current = '';
      return;
    }
    
    // Нет диалога для этого bottleneck
    console.log('✗ No dialog found for bottleneck:', targetBottleneck.id);
    setLocalDialogState(null);
    hasLoadedDialogRef.current = dialogKey;
  }, [props?.bottleneck?.id, editingId, storeDialogState?.bottleneckId, storeDialogState?.messages.length, isInitializingDialog]);

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
      
      // Проверяем, что есть хотя бы одно сообщение
      if (!newDialogState.messages || newDialogState.messages.length === 0) {
        console.error('Dialog state has no messages!', newDialogState);
        throw new Error('Dialog state не содержит сообщений');
      }
      
      // Проверяем, что первое сообщение от агента не пустое
      const firstMessage = newDialogState.messages[0];
      if (!firstMessage || !firstMessage.content || firstMessage.content.trim().length === 0) {
        console.error('First message is empty!', firstMessage);
        throw new Error('Первое сообщение от агента пустое');
      }
      
      console.log('First message content:', firstMessage.content.substring(0, 100));
      
      // Устанавливаем флаг, что мы только что инициализировали диалог
      justInitializedDialogRef.current = true;
      
      // Устанавливаем состояние синхронно
      setLocalDialogState(newDialogState);
      setDialogState(newDialogState);
      
      console.log('Dialog state set, messages count:', newDialogState.messages.length);
      
      // Проверяем, что состояние установилось через небольшую задержку
      setTimeout(() => {
        console.log('Dialog state after set - checking...');
        // Проверяем через callback, чтобы увидеть актуальное состояние
        setLocalDialogState(currentState => {
          if (currentState && currentState.messages.length > 0) {
            console.log('Dialog state successfully set with', currentState.messages.length, 'messages');
          } else {
            console.error('Dialog state was reset or is empty!');
            // Если состояние было сброшено, восстанавливаем его
            if (newDialogState && newDialogState.messages.length > 0) {
              console.log('Restoring dialog state...');
              return newDialogState;
            }
          }
          return currentState;
        });
      }, 200);
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
      console.log('Chat response result:', {
        hasUpdatedBottleneck: !!result.updatedBottleneck,
        hasFieldSuggestions: !!result.fieldSuggestions,
        fieldSuggestionsCount: result.fieldSuggestions?.length || 0,
        updatedBottleneck: result.updatedBottleneck,
      });
      
      const updatedDialogState = result.updatedDialogState;
      setLocalDialogState(updatedDialogState);
      setDialogState(updatedDialogState);

      // Автоматически обновляем bottleneck, если есть обновления от агента
      if (result.updatedBottleneck && targetBottleneck) {
        console.log('Updating bottleneck from API:', result.updatedBottleneck);
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

      // Автоматически применяем предложения изменений (карточка read-only, пользователь не может редактировать вручную)
      if (result.fieldSuggestions && result.fieldSuggestions.length > 0) {
        // Определяем актуальный bottleneck для обновления
        let currentTargetBottleneck = targetBottleneck;
        
        // Если это новое улучшение и оно было только что создано, используем его
        if (isCreating && currentBottleneck && currentBottleneck.id.startsWith('temp_')) {
          currentTargetBottleneck = currentBottleneck;
        } else if (editingId) {
          currentTargetBottleneck = bottlenecks.find(b => b.id === editingId) || currentTargetBottleneck;
        } else if (currentBottleneck) {
          currentTargetBottleneck = currentBottleneck;
        } else if (props?.bottleneck) {
          currentTargetBottleneck = props.bottleneck;
        }
        
        if (currentTargetBottleneck && !currentTargetBottleneck.id.startsWith('temp_')) {
          // Собираем все изменения в один объект для одного обновления
          const updates: Partial<Bottleneck> = {};
          
          result.fieldSuggestions.forEach((suggestion: FieldSuggestion) => {
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
              
              updates[field] = newValue;
            } catch (e) {
              console.error('Error processing suggestion:', e);
            }
          });
          
          // Применяем все изменения одним обновлением
          if (Object.keys(updates).length > 0) {
            updateBottleneck(currentTargetBottleneck.id, updates);
            
            // Обновляем локальное состояние после небольшой задержки, чтобы store успел обновиться
            setTimeout(() => {
              const updated = bottlenecks.find(b => b.id === currentTargetBottleneck.id);
              if (updated) {
                setCurrentBottleneck(updated);
              }
            }, 100);
          }
        }
        
        // Не показываем предложения пользователю - они уже применены автоматически
        setFieldSuggestions([]);
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

  // Удаление последних сообщений из диалога
  const handleDeleteLastMessages = (count: number) => {
    if (!dialogState || dialogState.messages.length === 0) return;
    
    const newMessages = dialogState.messages.slice(0, -count);
    const updatedDialogState: DialogState = {
      ...dialogState,
      messages: newMessages,
    };
    
    setLocalDialogState(updatedDialogState);
    setDialogState(updatedDialogState); // Сохраняем в store
    console.log('Deleted', count, 'messages, remaining:', newMessages.length);
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
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Диалог с консультантом</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Общайтесь с агентом, чтобы улучшить описание точки улучшения
                </p>
              </div>
              <div className="flex items-center gap-2">
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
                <button
                  onClick={() => {
                    // Сохраняем dialogState в store перед переходом
                    if (dialogState) {
                      setDialogState(dialogState);
                    }
                    
                    setIsCreating(false);
                    setEditingId(null);
                    setCurrentBottleneck(undefined);
                    setLocalDialogState(null);
                    // НЕ сбрасываем dialogState в store - он должен сохраниться
                    setFieldSuggestions([]);
                    setHasUnsavedChanges(false);
                    navigateToBottlenecksList();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  title="Вернуться к списку улучшений"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">К списку</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <ChatInterface
              dialogState={dialogState}
              isLoading={isChatLoading}
              onSendMessage={handleSendMessage}
              onStartDialog={() => targetBottleneck && handleStartDialog(targetBottleneck)}
              isInitializing={isInitializingDialog}
              onDeleteLastMessages={handleDeleteLastMessages}
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
      console.log('=== handleEdit called for bottleneck:', bottleneckId);
      setEditingId(bottleneckId);
      setCurrentBottleneck(bottleneck);
      setFieldSuggestions([]);
      
      // Принудительно загружаем диалог из store, если он есть
      // Также проверяем через getState на случай, если storeDialogState еще не обновился
      const currentStoreState = useAppStore.getState();
      const dialogStateToLoad = storeDialogState || currentStoreState.dialogState;
      
      console.log('Checking dialog state:', {
        storeDialogState: storeDialogState ? `${storeDialogState.bottleneckId} (${storeDialogState.messages.length} msgs)` : 'null',
        currentStoreState: currentStoreState.dialogState ? `${currentStoreState.dialogState.bottleneckId} (${currentStoreState.dialogState.messages.length} msgs)` : 'null',
        dialogStateToLoad: dialogStateToLoad ? `${dialogStateToLoad.bottleneckId} (${dialogStateToLoad.messages.length} msgs)` : 'null',
      });
      
      if (dialogStateToLoad && dialogStateToLoad.bottleneckId === bottleneckId) {
        if (dialogStateToLoad.messages.length > 0) {
          console.log('✓ Loading existing dialog for bottleneck:', bottleneckId, 'with', dialogStateToLoad.messages.length, 'messages');
          setLocalDialogState(dialogStateToLoad);
          setDialogState(dialogStateToLoad);
          hasLoadedDialogRef.current = `${bottleneckId}-${bottleneckId}`;
        } else {
          console.log('✗ Dialog state exists but has no messages for bottleneck:', bottleneckId);
          setLocalDialogState(null);
          hasLoadedDialogRef.current = '';
        }
      } else {
        console.log('✗ No existing dialog found for bottleneck:', bottleneckId);
        setLocalDialogState(null);
        hasLoadedDialogRef.current = '';
      }
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

