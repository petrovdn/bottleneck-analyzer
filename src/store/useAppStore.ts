import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  BusinessData, 
  Bottleneck, 
  Stage, 
  DialogState,
  RefinedBottleneck,
  MultiAgentState,
  ViewMode,
  SingleBottleneckExport,
  FullExport
} from '@/types';

interface AppState {
  stage: Stage;
  businessData: BusinessData | null;
  bottlenecks: Bottleneck[];
  selectedBottleneck: Bottleneck | null;
  refinedBottlenecks: Map<string, RefinedBottleneck>;
  generatedPrompt: string;
  isLoading: boolean;
  error: string | null;
  dialogState: DialogState | null; // Текущий активный диалог (для обратной совместимости)
  dialogStates: Map<string, DialogState>; // Все диалоги по ID точек улучшения
  isChatLoading: boolean;
  multiAgentState: MultiAgentState | null;
  isMultiAgentLoading: boolean;
  viewMode: ViewMode;
  hasUnsavedChanges: boolean;
}

interface AppActions {
  // Основные действия
  setStage: (stage: Stage) => void;
  setBusinessData: (data: BusinessData) => void;
  setBottlenecks: (bottlenecks: Bottleneck[]) => void;
  setSelectedBottleneck: (bottleneck: Bottleneck | null) => void;
  setGeneratedPrompt: (prompt: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  
  // Действия для диалога
  setDialogState: (dialogState: DialogState | null) => void;
  setChatLoading: (isChatLoading: boolean) => void;
  addRefinedBottleneck: (bottleneckId: string, refined: RefinedBottleneck) => void;
  getRefinedBottleneck: (bottleneckId: string) => RefinedBottleneck | undefined;
  clearDialogState: () => void;
  getDialogState: (bottleneckId: string) => DialogState | undefined;
  saveDialogState: (bottleneckId: string, dialogState: DialogState) => void;
  
  // Действия для мультиагентной системы
  setMultiAgentState: (state: MultiAgentState | null) => void;
  setMultiAgentLoading: (isLoading: boolean) => void;
  
  // Навигация
  setViewMode: (mode: ViewMode) => void;
  navigateToMultiAgent: () => void;
  navigateToBottlenecksList: () => void;
  navigateToBottleneckDetail: (bottleneckId: string) => void;
  
  // Управление узкими местами
  addBottleneck: (bottleneck: Bottleneck) => void;
  updateBottleneck: (bottleneckId: string, updates: Partial<Bottleneck>) => void;
  deleteBottleneck: (bottleneckId: string) => void;
  
  // Сохранение/загрузка состояния
  saveState: () => void;
  loadState: () => void;
  
  // Управление несохраненными изменениями
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  
  // Импорт данных
  importSingleBottleneck: (data: SingleBottleneckExport, mode: 'replace' | 'merge') => void;
  importFullData: (data: FullExport, mode: 'replace' | 'merge') => void;
}

const initialState: AppState = {
  stage: 'discovery',
  businessData: null,
  bottlenecks: [],
  selectedBottleneck: null,
  refinedBottlenecks: new Map(),
  generatedPrompt: '',
  isLoading: false,
  error: null,
  dialogState: null,
  dialogStates: new Map(),
  isChatLoading: false,
  multiAgentState: null,
  isMultiAgentLoading: false,
  viewMode: 'multi_agent_dialog',
  hasUnsavedChanges: false,
};

// Функция для сериализации Map
const serializeMap = (map: Map<string, any>) => {
  return Array.from(map.entries());
};

// Функция для десериализации Map
const deserializeMap = (entries: [string, any][]): Map<string, any> => {
  return new Map(entries || []);
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,
  
  // Основные действия
  setStage: (stage) => set({ stage }),
  
  setBusinessData: (data) => set({ businessData: data }),
  
  setBottlenecks: (bottlenecks) => set({ bottlenecks }),
  
  setSelectedBottleneck: (bottleneck) => set({ 
    selectedBottleneck: bottleneck,
    // Сбрасываем состояние диалога при смене узкого места
    dialogState: null,
  }),
  
  setGeneratedPrompt: (prompt) => set({ generatedPrompt: prompt }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  reset: () => set({
    ...initialState,
    refinedBottlenecks: new Map(),
  }),
  
  // Действия для диалога
  setDialogState: (dialogState) => {
    console.log('=== setDialogState called:', dialogState ? `bottleneckId: ${dialogState.bottleneckId}, messages: ${dialogState.messages.length}` : 'null');
    if (dialogState) {
      // Сохраняем диалог в Map всех диалогов
      const dialogStates = new Map(get().dialogStates);
      dialogStates.set(dialogState.bottleneckId, dialogState);
      set({ dialogState, dialogStates });
    } else {
      set({ dialogState: null });
    }
  },
  
  getDialogState: (bottleneckId: string) => {
    return get().dialogStates.get(bottleneckId);
  },
  
  saveDialogState: (bottleneckId: string, dialogState: DialogState) => {
    const dialogStates = new Map(get().dialogStates);
    dialogStates.set(bottleneckId, dialogState);
    set({ dialogStates, dialogState }); // Также обновляем текущий dialogState
  },
  
  setChatLoading: (isChatLoading) => set({ isChatLoading }),
  
  addRefinedBottleneck: (bottleneckId, refined) => {
    const current = get().refinedBottlenecks;
    const updated = new Map(current);
    updated.set(bottleneckId, refined);
    set({ refinedBottlenecks: updated });
  },
  
  getRefinedBottleneck: (bottleneckId) => {
    return get().refinedBottlenecks.get(bottleneckId);
  },
  
  clearDialogState: () => set({ dialogState: null }),
  
  // Действия для мультиагентной системы
  setMultiAgentState: (multiAgentState) => set({ multiAgentState }),
  setMultiAgentLoading: (isMultiAgentLoading) => set({ isMultiAgentLoading }),
  
  // Навигация
  setViewMode: (viewMode) => set({ viewMode }),
  
  navigateToMultiAgent: () => {
    set({ 
      viewMode: 'multi_agent_dialog',
      selectedBottleneck: null,
      dialogState: null,
    });
  },
  
  navigateToBottlenecksList: () => {
    // НЕ сбрасываем dialogState - сохраняем его для возможного возврата
    set({ 
      viewMode: 'bottlenecks_list',
      selectedBottleneck: null,
      // dialogState остается в store
    });
  },
  
  navigateToBottleneckDetail: (bottleneckId: string) => {
    const bottleneck = get().bottlenecks.find(b => b.id === bottleneckId);
    if (bottleneck) {
      const currentDialogState = get().dialogState;
      // Если есть dialogState для этого bottleneck, сохраняем его
      // Если нет, оставляем текущий dialogState (он может быть загружен из localStorage)
      // Компонент сам проверит, подходит ли dialogState для этого bottleneck
      const dialogState = currentDialogState?.bottleneckId === bottleneckId 
        ? currentDialogState 
        : currentDialogState; // Не сбрасываем - компонент проверит соответствие
      
      set({ 
        viewMode: 'bottleneck_detail',
        selectedBottleneck: bottleneck,
        dialogState: dialogState,
      });
      
      console.log('Navigated to bottleneck detail:', bottleneckId, 'dialogState:', dialogState ? `${dialogState.messages.length} messages` : 'null');
    }
  },
  
  // Управление узкими местами
  addBottleneck: (bottleneck) => {
    const bottlenecks = [...get().bottlenecks, bottleneck];
    set({ bottlenecks });
    get().saveState();
  },
  
  updateBottleneck: (bottleneckId, updates) => {
    const bottlenecks = get().bottlenecks.map(b => 
      b.id === bottleneckId ? { ...b, ...updates } : b
    );
    set({ bottlenecks });
    if (get().selectedBottleneck?.id === bottleneckId) {
      set({ selectedBottleneck: bottlenecks.find(b => b.id === bottleneckId) || null });
    }
    get().saveState();
  },
  
  deleteBottleneck: (bottleneckId) => {
    const bottlenecks = get().bottlenecks.filter(b => b.id !== bottleneckId);
    set({ 
      bottlenecks,
      selectedBottleneck: get().selectedBottleneck?.id === bottleneckId ? null : get().selectedBottleneck,
    });
    get().saveState();
  },
  
  // Сохранение/загрузка состояния
  saveState: () => {
    // Состояние сохраняется автоматически через persist middleware
  },
  
  loadState: () => {
    // Состояние загружается автоматически через persist middleware
  },
  
  // Управление несохраненными изменениями
  setHasUnsavedChanges: (hasChanges: boolean) => set({ hasUnsavedChanges: hasChanges }),
  
  // Импорт данных
  importSingleBottleneck: (data: SingleBottleneckExport, mode: 'replace' | 'merge') => {
    const state = get();
    
    if (mode === 'replace') {
      // Заменяем точку улучшения, если она существует
      const existingIndex = state.bottlenecks.findIndex(b => b.id === data.bottleneck.id);
      if (existingIndex >= 0) {
        const bottlenecks = [...state.bottlenecks];
        bottlenecks[existingIndex] = data.bottleneck;
        set({ bottlenecks });
      } else {
        // Добавляем новую точку
        set({ bottlenecks: [...state.bottlenecks, data.bottleneck] });
      }
      
      // Устанавливаем dialogState
      if (data.dialogState) {
        set({ dialogState: data.dialogState });
      }
      
      // Добавляем refinedBottleneck, если есть
      if (data.refinedBottleneck) {
        const refinedMap = new Map(state.refinedBottlenecks);
        refinedMap.set(data.bottleneck.id, data.refinedBottleneck);
        set({ refinedBottlenecks: refinedMap });
      }
      
      // Выбираем эту точку
      set({ selectedBottleneck: data.bottleneck });
    } else {
      // Merge режим: проверяем конфликты
      const existingBottleneck = state.bottlenecks.find(b => b.id === data.bottleneck.id);
      if (existingBottleneck) {
        // Если точка существует, спрашиваем пользователя (это будет обработано в компоненте)
        // Пока просто заменяем
        const bottlenecks = state.bottlenecks.map(b => 
          b.id === data.bottleneck.id ? data.bottleneck : b
        );
        set({ bottlenecks });
      } else {
        // Добавляем новую точку
        set({ bottlenecks: [...state.bottlenecks, data.bottleneck] });
      }
      
      // Объединяем dialogState
      if (data.dialogState) {
        set({ dialogState: data.dialogState });
      }
      
      // Объединяем refinedBottleneck
      if (data.refinedBottleneck) {
        const refinedMap = new Map(state.refinedBottlenecks);
        refinedMap.set(data.bottleneck.id, data.refinedBottleneck);
        set({ refinedBottlenecks: refinedMap });
      }
    }
    
    get().saveState();
  },
  
  importFullData: (data: FullExport, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      // Полная замена всех данных
      // Восстанавливаем все dialogStates из импортированных данных
      const dialogStatesMap = new Map(Object.entries(data.dialogStates));
      set({
        businessData: data.businessData,
        multiAgentState: data.multiAgentState,
        bottlenecks: data.bottlenecks,
        refinedBottlenecks: new Map(Object.entries(data.refinedBottlenecks)),
        dialogStates: dialogStatesMap,
        dialogState: null, // Текущий диалог будет установлен при открытии точки
        selectedBottleneck: null,
      });
    } else {
      // Merge режим: объединяем данные
      const state = get();
      
      // Объединяем businessData (приоритет новым данным)
      if (data.businessData) {
        set({ businessData: data.businessData });
      }
      
      // Объединяем multiAgentState (приоритет новым данным)
      if (data.multiAgentState) {
        set({ multiAgentState: data.multiAgentState });
      }
      
      // Объединяем bottlenecks (проверяем конфликты по ID)
      const existingIds = new Set(state.bottlenecks.map(b => b.id));
      const newBottlenecks = data.bottlenecks.filter(b => !existingIds.has(b.id));
      set({ bottlenecks: [...state.bottlenecks, ...newBottlenecks] });
      
      // Объединяем refinedBottlenecks
      const refinedMap = new Map(state.refinedBottlenecks);
      Object.entries(data.refinedBottlenecks).forEach(([id, refined]) => {
        refinedMap.set(id, refined);
      });
      set({ refinedBottlenecks: refinedMap });
      
      // Объединяем dialogStates
      const dialogStatesMap = new Map(state.dialogStates);
      Object.entries(data.dialogStates).forEach(([bottleneckId, dialogState]) => {
        dialogStatesMap.set(bottleneckId, dialogState);
      });
      set({ dialogStates: dialogStatesMap });
    }
    
    get().saveState();
  },
    }),
    {
      name: 'bottleneck-analyzer-storage',
      partialize: (state) => {
        const partialized = {
          businessData: state.businessData,
          bottlenecks: state.bottlenecks,
          refinedBottlenecks: serializeMap(state.refinedBottlenecks),
          multiAgentState: state.multiAgentState,
          viewMode: state.viewMode,
          dialogState: state.dialogState, // Текущий активный диалог (для обратной совместимости)
          dialogStates: serializeMap(state.dialogStates), // Все диалоги
        };
        console.log('=== Saving to localStorage:', {
          hasDialogState: !!partialized.dialogState,
          dialogStateBottleneckId: partialized.dialogState?.bottleneckId,
          dialogStateMessagesCount: partialized.dialogState?.messages?.length || 0,
          dialogStatesCount: state.dialogStates.size,
        });
        return partialized;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Восстанавливаем Map из сериализованных данных
          if (state.refinedBottlenecks && Array.isArray(state.refinedBottlenecks)) {
            state.refinedBottlenecks = deserializeMap(state.refinedBottlenecks as any);
          }
          
          // Восстанавливаем dialogStates Map
          if (state.dialogStates && Array.isArray(state.dialogStates)) {
            state.dialogStates = deserializeMap(state.dialogStates as any);
          } else if (!state.dialogStates) {
            // Если dialogStates нет, создаем пустой Map
            state.dialogStates = new Map();
            // Если есть старый dialogState, добавляем его в Map
            if (state.dialogState) {
              state.dialogStates.set(state.dialogState.bottleneckId, state.dialogState);
            }
          }
          
          // Логируем загрузку dialogState для отладки
          if (state.dialogState) {
            console.log('=== Dialog state loaded from localStorage:', {
              bottleneckId: state.dialogState.bottleneckId,
              messagesCount: state.dialogState.messages?.length || 0,
              phase: state.dialogState.phase,
            });
          }
          console.log('=== DialogStates loaded from localStorage:', {
            count: state.dialogStates?.size || 0,
            bottleneckIds: state.dialogStates ? Array.from(state.dialogStates.keys()) : [],
          });
        } else {
          console.log('=== No state in localStorage');
        }
      },
    }
  )
);


