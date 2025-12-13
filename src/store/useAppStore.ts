import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  BusinessData, 
  Bottleneck, 
  Stage, 
  DialogState,
  RefinedBottleneck,
  MultiAgentState,
  ViewMode
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
  dialogState: DialogState | null;
  isChatLoading: boolean;
  multiAgentState: MultiAgentState | null;
  isMultiAgentLoading: boolean;
  viewMode: ViewMode;
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
  
  // Действия для мультиагентной системы
  setMultiAgentState: (state: MultiAgentState | null) => void;
  setMultiAgentLoading: (isLoading: boolean) => void;
  
  // Навигация
  setViewMode: (mode: "multi_agent_dialog" | "bottlenecks_list" | "bottleneck_detail") => void;
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
  isChatLoading: false,
  multiAgentState: null,
  isMultiAgentLoading: false,
  viewMode: 'multi_agent_dialog',
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
  setDialogState: (dialogState) => set({ dialogState }),
  
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
    set({ 
      viewMode: 'bottlenecks_list',
      selectedBottleneck: null,
      dialogState: null,
    });
  },
  
  navigateToBottleneckDetail: (bottleneckId: string) => {
    const bottleneck = get().bottlenecks.find(b => b.id === bottleneckId);
    if (bottleneck) {
      set({ 
        viewMode: 'bottleneck_detail',
        selectedBottleneck: bottleneck,
        dialogState: null,
      });
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
    }),
    {
      name: 'bottleneck-analyzer-storage',
      partialize: (state) => ({
        businessData: state.businessData,
        bottlenecks: state.bottlenecks,
        refinedBottlenecks: serializeMap(state.refinedBottlenecks),
        multiAgentState: state.multiAgentState,
        viewMode: state.viewMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Восстанавливаем Map из сериализованных данных
          if (state.refinedBottlenecks && Array.isArray(state.refinedBottlenecks)) {
            state.refinedBottlenecks = deserializeMap(state.refinedBottlenecks as any);
          }
        }
      },
    }
  )
);


