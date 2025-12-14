export type Stage = "discovery" | "bottlenecks" | "prompt";

export type ViewMode = 
  | "multi_agent_dialog"    // Диалог с мультиагентной системой
  | "bottlenecks_list"       // Список узких мест
  | "bottleneck_detail";    // Детали конкретного узкого места

export type Priority = "high" | "medium" | "low";

export type MessageRole = "user" | "assistant" | "system";

export type DialogPhase = 
  | "clarifying"      // Уточнение проблемы
  | "deep_dive"       // Глубокое погружение
  | "solution_design" // Проектирование решения
  | "implementation"  // Обсуждение реализации
  | "complete";       // Диалог завершен

// Типы для мультиагентной системы
export type AgentType = 
  | "manager"           // Manager-агент (оркестратор)
  | "process_mining"    // Процесс-майнинг агент
  | "bottleneck_finder" // Bottleneck-агент
  | "redesign";         // Re-design агент

export type MultiAgentPhase =
  | "initialization"    // Инициализация и сегментация цепочки
  | "process_mapping"   // Построение карты процессов
  | "bottleneck_analysis" // Анализ узких мест
  | "solution_design"   // Проектирование решений
  | "complete";         // Завершено

// Карта процесса (этап в цепочке ценности)
export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  inputs: string[];           // Входы этапа
  outputs: string[];          // Выходы этапа
  participants: string[];     // Участники
  cycleTime?: {              // Время цикла
    median?: number;          // Медианное (в часах)
    max?: number;             // Максимальное (в часах)
    unit: "hours" | "days" | "weeks";
  };
  problemFrequency?: number;  // Частота проблем (0-1)
  queueSize?: number;         // Размер очереди
  utilization?: number;       // Загрузка ресурса (0-1)
  isBottleneck?: boolean;     // Является ли узким местом
  bottleneckReason?: string;  // Причина, почему узкое место
}

// Карта цепочки ценности
export interface ValueChainMap {
  id: string;
  productDescription: string;
  steps: ProcessStep[];
  createdAt: string;
  updatedAt: string;
}

// Сообщение от агента
export interface AgentMessage {
  agentType: AgentType;
  content: string;
  timestamp: string;
  phase: MultiAgentPhase;
  metadata?: Record<string, any>;
}

export interface BusinessData {
  productDescription: string;
  teamSize: number;
  workflows: string;
  kpis: string;
}

export interface Bottleneck {
  id: string;
  title: string;
  processArea: string;
  problemDescription: string;
  currentImpact: string;
  priority: Priority;
  potentialGain: string;
  asIsProcess: string;
  toBeProcess: string;
  suggestedAgents: string[];
  mcpToolsNeeded: string[];
}

// Уточненная версия узкого места после диалога
export interface RefinedBottleneck extends Bottleneck {
  userClarifications: string[];      // Уточнения от пользователя
  agreedSolution: string;            // Согласованное решение
  implementationDetails: string;     // Детали реализации
  dialogSummary: string;             // Краткое резюме диалога
  refinedAt: string;                 // Когда было уточнено
  processDescription: string;        // Краткое описание нового процесса
  technicalSpec: string;             // Техническое задание на создание сервиса
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  phase?: DialogPhase;
  thinking?: string;  // Размышления агента (для отладки)
}

export interface DialogState {
  bottleneckId: string;
  phase: DialogPhase;
  messages: ChatMessage[];
  insights: string[];              // Собранные инсайты
  clarifications: string[];        // Уточнения от пользователя
  proposedSolution: string | null; // Предложенное решение
  isComplete: boolean;
}

// Состояние мультиагентной системы
export interface MultiAgentState {
  phase: MultiAgentPhase;
  businessData: BusinessData;
  valueChainMap: ValueChainMap | null;
  agentMessages: AgentMessage[];
  currentQuestion: string | null;  // Текущий вопрос к пользователю
  collectedAnswers: Record<string, { answer: string; timestamp: string }>; // Собранные ответы с временными метками
  bottlenecks: Bottleneck[];
  isComplete: boolean;
  thinking: string;                // Размышления агентов
}

export interface AppState {
  stage: Stage;
  businessData: BusinessData | null;
  bottlenecks: Bottleneck[];
  selectedBottleneck: Bottleneck | null;
  refinedBottlenecks: Map<string, RefinedBottleneck>; // Уточненные версии
  generatedPrompt: string;
  isLoading: boolean;
  error: string | null;
  
  // Состояние диалога
  dialogState: DialogState | null;
  isChatLoading: boolean;
}

export interface AnalyzeRequest {
  businessData: BusinessData;
}

export interface AnalyzeResponse {
  bottlenecks: Bottleneck[];
}

export interface GeneratePromptRequest {
  businessData: BusinessData;
  bottleneck: Bottleneck;
  refinedBottleneck?: RefinedBottleneck; // Опционально - уточненная версия
}

export interface GeneratePromptResponse {
  prompt: string;
}

// API для чата
export interface ChatRequest {
  businessData: BusinessData;
  bottleneck: Bottleneck;
  dialogState: DialogState;
  userMessage: string;
}

// Предложение изменения поля формы от агента
export interface FieldSuggestion {
  field: keyof Bottleneck;
  currentValue: string;
  suggestedValue: string;
  reason: string; // Почему агент предлагает это изменение
}

export interface ChatResponse {
  message: ChatMessage;
  updatedDialogState: DialogState;
  refinedBottleneck?: RefinedBottleneck; // Если диалог завершен
  updatedBottleneck?: Partial<Bottleneck>; // Обновления карточки в реальном времени
  fieldSuggestions?: FieldSuggestion[]; // Предложения изменений полей
}

// API для мультиагентной системы
export interface MultiAgentRequest {
  businessData: BusinessData;
  userMessage?: string;  // Ответ пользователя на вопрос
  multiAgentState?: MultiAgentState;
}

export interface MultiAgentResponse {
  multiAgentState: MultiAgentState;
  question?: string;  // Вопрос к пользователю (если нужен ответ)
  bottlenecks?: Bottleneck[];  // Найденные узкие места
}


