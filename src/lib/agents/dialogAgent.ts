import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage } from '@langchain/core/messages';
import { 
  BusinessData, 
  Bottleneck, 
  DialogState, 
  ChatMessage, 
  DialogPhase,
  RefinedBottleneck 
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Состояние для обработки диалога
interface GraphState {
  businessData: BusinessData;
  bottleneck: Bottleneck;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  dialogPhase: DialogPhase;
  insights: string[];
  clarifications: string[];
  proposedSolution: string | null;
  currentUserMessage: string;
  responseMessage: string;
  thinking: string;
  isComplete: boolean;
}

// Системные промпты для разных фаз диалога
const PHASE_PROMPTS: Record<DialogPhase, string> = {
  clarifying: `Ты — эксперт-консультант по оптимизации бизнес-процессов. Сейчас фаза УТОЧНЕНИЯ текущего процесса (AS-IS).

ТВОЯ ЗАДАЧА:
1. Детально выяснить, как процесс работает СЕЙЧАС
2. Понять все шаги, участников, инструменты, временные рамки
3. Выявить проблемы, узкие места, неэффективности
4. Понять контекст и ограничения

СТИЛЬ ОБЩЕНИЯ:
- Будь эмпатичным и внимательным
- Задавай открытые вопросы о текущем процессе
- Уточняй детали: кто, что, когда, как, почему
- Переформулируй ответы для подтверждения понимания

ПРИМЕРЫ ВОПРОСОВ:
- "Расскажите подробнее, как сейчас происходит [процесс]?"
- "Кто участвует в этом процессе? Какие роли?"
- "Сколько времени занимает каждый этап?"
- "Какие инструменты или системы используются?"
- "Где возникают задержки или проблемы?"
- "Что мешает процессу быть быстрее/эффективнее?"

После того как соберешь полную картину текущего процесса, предложи перейти к обсуждению желаемого состояния.`,

  deep_dive: `Ты — эксперт-консультант по оптимизации бизнес-процессов. Сейчас фаза ОПРЕДЕЛЕНИЯ ЖЕЛАЕМОГО ПРОЦЕССА (TO-BE).

ТВОЯ ЗАДАЧА:
1. Понять, как процесс должен работать в идеале
2. Выяснить цели и ожидания пользователя
3. Определить ключевые улучшения
4. Обсудить возможности и ограничения

СТИЛЬ ОБЩЕНИЯ:
- Помогай визуализировать идеальный процесс
- Задавай вопросы о желаемых результатах
- Проверяй реалистичность ожиданий
- Помогай формулировать конкретные цели

ПРИМЕРЫ ФРАЗ:
- "Как вы видите идеальный процесс? Опишите пошагово."
- "Что должно измениться по сравнению с текущим процессом?"
- "Какие результаты вы хотите получить?"
- "Какие метрики важны для вас?"
- "Что должно стать быстрее/проще/точнее?"

После обсуждения желаемого состояния предложи перейти к проектированию решения.`,

  solution_design: `Ты — эксперт-консультант по оптимизации бизнес-процессов. Сейчас фаза ПРОЕКТИРОВАНИЯ РЕШЕНИЯ.

ТВОЯ ЗАДАЧА:
1. Предложить конкретное решение для перехода от AS-IS к TO-BE
2. Описать новый процесс детально
3. Определить необходимые сервисы, агенты, инструменты
4. Согласовать финальный вариант решения

СТИЛЬ ОБЩЕНИЯ:
- Будь конкретным и практичным
- Описывай новый процесс пошагово
- Предлагай варианты, обсуждай плюсы и минусы
- Учитывай ограничения и возможности

СТРУКТУРА РЕШЕНИЯ:
1. Описание нового процесса (как будет работать)
2. Какие сервисы/агенты нужны и что они делают
3. Как они взаимодействуют между собой
4. Какие инструменты и интеграции потребуются
5. Какие метрики успеха

После согласования решения предложи перейти к техническому заданию.`,

  implementation: `Ты — эксперт-консультант по оптимизации бизнес-процессов. Сейчас фаза СОЗДАНИЯ ТЕХНИЧЕСКОГО ЗАДАНИЯ.

ТВОЯ ЗАДАЧА:
1. Создать детальное техническое задание на сервис
2. Описать функциональные требования
3. Определить технические требования
4. Указать этапы реализации

СТИЛЬ ОБЩЕНИЯ:
- Будь конкретным и техническим
- Структурируй информацию четко
- Уточняй детали если нужно

СТРУКТУРА ТЗ:
1. Назначение сервиса
2. Функциональные требования
3. Технические требования
4. Интерфейсы и интеграции
5. Этапы разработки
6. Критерии приемки

Когда ТЗ готово, подведи итог и заверши диалог.`,

  complete: `Диалог завершен. Резюмируй результаты: краткое описание нового процесса и готовность ТЗ.`
};

// Создание LLM
function createLLM() {
  return new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
  });
}

// Функции обработки диалога

// 1. Анализ фазы и подготовка контекста
async function analyzePhase(state: GraphState): Promise<Partial<GraphState>> {
  const llm = createLLM();
  
  const analysisPrompt = `Проанализируй текущее состояние диалога и определи:
1. На какой мы фазе (clarifying/deep_dive/solution_design/implementation/complete)
2. Какие ключевые инсайты уже собраны
3. Что нужно уточнить дальше

БИЗНЕС:
${state.businessData.productDescription}
Команда: ${state.businessData.teamSize}
Процессы: ${state.businessData.workflows}
KPI: ${state.businessData.kpis}

УЗКОЕ МЕСТО:
${state.bottleneck.title}
${state.bottleneck.problemDescription}

ТЕКУЩАЯ ФАЗА: ${state.dialogPhase}
СОБРАННЫЕ ИНСАЙТЫ: ${state.insights.join(', ') || 'пока нет'}
УТОЧНЕНИЯ ПОЛЬЗОВАТЕЛЯ: ${state.clarifications.join(', ') || 'пока нет'}

ПОСЛЕДНЕЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ:
${state.currentUserMessage}

Ответь в JSON формате:
{
  "shouldAdvancePhase": true/false,
  "nextPhase": "clarifying|deep_dive|solution_design|implementation|complete",
  "newInsights": ["инсайт1", "инсайт2"],
  "reasoning": "почему принял такое решение"
}`;

  const response = await llm.invoke(analysisPrompt);
  const content = response.content.toString();
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      
      return {
        dialogPhase: analysis.shouldAdvancePhase ? analysis.nextPhase : state.dialogPhase,
        insights: [...state.insights, ...(analysis.newInsights || [])],
        thinking: analysis.reasoning,
        isComplete: analysis.nextPhase === 'complete',
      };
    }
  } catch (e) {
    console.error('Error parsing phase analysis:', e);
  }
  
  return {};
}

// 2. Генерация ответа агента
async function generateResponse(state: GraphState): Promise<Partial<GraphState>> {
  const llm = createLLM();
  
  const phasePrompt = PHASE_PROMPTS[state.dialogPhase];
  
  const systemPrompt = `${phasePrompt}

КОНТЕКСТ БИЗНЕСА:
Продукт: ${state.businessData.productDescription}
Команда: ${state.businessData.teamSize} человек
Процессы: ${state.businessData.workflows}
KPI: ${state.businessData.kpis}

АНАЛИЗИРУЕМОЕ УЗКОЕ МЕСТО:
Название: ${state.bottleneck.title}
Область: ${state.bottleneck.processArea}
Проблема: ${state.bottleneck.problemDescription}
Текущее влияние: ${state.bottleneck.currentImpact}
Потенциальный выигрыш: ${state.bottleneck.potentialGain}

СОБРАННЫЕ ИНСАЙТЫ:
${state.insights.length > 0 ? state.insights.map((i, idx) => `${idx + 1}. ${i}`).join('\n') : 'Пока нет инсайтов'}

УТОЧНЕНИЯ ОТ ПОЛЬЗОВАТЕЛЯ:
${state.clarifications.length > 0 ? state.clarifications.map((c, idx) => `${idx + 1}. ${c}`).join('\n') : 'Пока нет уточнений'}

${state.proposedSolution ? `ПРЕДЛОЖЕННОЕ РЕШЕНИЕ:\n${state.proposedSolution}` : ''}

Отвечай на русском языке. Будь конкретным и полезным.`;

  // Формируем полный промпт с историей
  const historyText = state.messages.map(m => 
    m.role === 'user' ? `Пользователь: ${m.content}` : `Консультант: ${m.content}`
  ).join('\n\n');
  
  const fullPrompt = `${systemPrompt}\n\n${historyText ? `История диалога:\n${historyText}\n\n` : ''}Пользователь: ${state.currentUserMessage}\n\nКонсультант:`;
  
  const response = await llm.invoke(fullPrompt);
  
  return {
    responseMessage: response.content.toString(),
    messages: [
      ...state.messages,
      { role: 'user' as const, content: state.currentUserMessage },
      { role: 'assistant' as const, content: response.content.toString() }
    ],
    clarifications: [...state.clarifications, state.currentUserMessage],
  };
}

// 3. Проверка и извлечение решения (для фазы solution_design)
async function checkSolution(state: GraphState): Promise<Partial<GraphState>> {
  if (state.dialogPhase !== 'solution_design' && state.dialogPhase !== 'implementation') {
    return {};
  }
  
  const llm = createLLM();
  
  const extractPrompt = `На основе диалога, извлеки предложенное решение.

ИСТОРИЯ ДИАЛОГА:
${state.messages.map(m => 
  m.role === 'user' ? `Пользователь: ${m.content}` : `Консультант: ${m.content}`
).join('\n\n')}

Последний ответ: ${state.responseMessage}

Если в диалоге уже обсуждается конкретное решение, опиши его. Если нет - верни null.

Формат ответа JSON:
{
  "hasSolution": true/false,
  "solution": "описание решения если есть"
}`;

  const response = await llm.invoke(extractPrompt);
  const content = response.content.toString();
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      if (result.hasSolution) {
        return {
          proposedSolution: result.solution,
        };
      }
    }
  } catch (e) {
    console.error('Error extracting solution:', e);
  }
  
  return {};
}

// Упрощенный подход: последовательная обработка без сложного графа
// Это более надежно и проще в поддержке для линейного диалога

// Основная функция обработки сообщения
// Используем упрощенный подход: последовательные вызовы функций
export async function processDialogMessage(
  businessData: BusinessData,
  bottleneck: Bottleneck,
  dialogState: DialogState,
  userMessage: string
): Promise<{
  message: ChatMessage;
  updatedDialogState: DialogState;
  refinedBottleneck?: RefinedBottleneck;
}> {
  
  // Конвертируем историю сообщений в простой формат
  const messages = dialogState.messages.map(msg => ({
    role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
    content: msg.content,
  }));
  
  // Создаем состояние для обработки
  const state: GraphState = {
    businessData,
    bottleneck,
    messages,
    dialogPhase: dialogState.phase,
    insights: dialogState.insights,
    clarifications: dialogState.clarifications,
    proposedSolution: dialogState.proposedSolution,
    currentUserMessage: userMessage,
    responseMessage: '',
    thinking: '',
    isComplete: dialogState.isComplete,
  };
  
  // Последовательно выполняем обработку
  // 1. Анализируем фазу
  const phaseResult = await analyzePhase(state);
  const updatedState = { ...state, ...phaseResult };
  
  // 2. Генерируем ответ
  const responseResult = await generateResponse(updatedState);
  const finalState = { ...updatedState, ...responseResult };
  
  // 3. Проверяем решение
  const solutionResult = await checkSolution(finalState);
  const completeState = { ...finalState, ...solutionResult };
  
  // Создаем сообщение ответа
  const responseMessage: ChatMessage = {
    id: uuidv4(),
    role: 'assistant',
    content: completeState.responseMessage,
    timestamp: new Date().toISOString(),
    phase: completeState.dialogPhase,
    thinking: completeState.thinking,
  };
  
  // Обновляем состояние диалога
  const updatedDialogState: DialogState = {
    bottleneckId: dialogState.bottleneckId,
    phase: completeState.dialogPhase,
    messages: [
      ...dialogState.messages,
      {
        id: uuidv4(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
      responseMessage,
    ],
    insights: completeState.insights,
    clarifications: completeState.clarifications,
    proposedSolution: completeState.proposedSolution,
    isComplete: completeState.isComplete,
  };
  
  // Если диалог завершен, создаем уточненное узкое место
  let refinedBottleneck: RefinedBottleneck | undefined;
  
  if (completeState.isComplete && completeState.proposedSolution) {
    refinedBottleneck = {
      ...bottleneck,
      userClarifications: completeState.clarifications,
      agreedSolution: completeState.proposedSolution,
      implementationDetails: await generateImplementationDetails(
        businessData,
        bottleneck,
        completeState.proposedSolution,
        completeState.insights
      ),
      dialogSummary: await generateDialogSummary(updatedDialogState),
      refinedAt: new Date().toISOString(),
      processDescription: await generateProcessDescription(
        businessData,
        bottleneck,
        updatedDialogState,
        completeState.proposedSolution
      ),
      technicalSpec: await generateTechnicalSpec(
        businessData,
        bottleneck,
        updatedDialogState,
        completeState.proposedSolution
      ),
    };
  }
  
  return {
    message: responseMessage,
    updatedDialogState,
    refinedBottleneck,
  };
}

// Генерация деталей реализации
async function generateImplementationDetails(
  businessData: BusinessData,
  bottleneck: Bottleneck,
  solution: string,
  insights: string[]
): Promise<string> {
  const llm = createLLM();
  
  const prompt = `На основе согласованного решения, сгенерируй детали реализации.

БИЗНЕС:
${businessData.productDescription}
Команда: ${businessData.teamSize}
KPI: ${businessData.kpis}

УЗКОЕ МЕСТО:
${bottleneck.title}
${bottleneck.problemDescription}

СОГЛАСОВАННОЕ РЕШЕНИЕ:
${solution}

ИНСАЙТЫ ИЗ ДИАЛОГА:
${insights.join('\n')}

Опиши:
1. Технические требования
2. Этапы реализации
3. Необходимые интеграции
4. Метрики успеха
5. Возможные риски

Формат: структурированный текст на русском.`;

  const response = await llm.invoke(prompt);
  return response.content.toString();
}

// Генерация резюме диалога
async function generateDialogSummary(dialogState: DialogState): Promise<string> {
  const llm = createLLM();
  
  const messagesText = dialogState.messages
    .map(m => `${m.role === 'user' ? 'Пользователь' : 'Консультант'}: ${m.content}`)
    .join('\n\n');
  
  const prompt = `Создай краткое резюме диалога (3-5 предложений).

ДИАЛОГ:
${messagesText}

ИНСАЙТЫ:
${dialogState.insights.join(', ')}

Резюме должно содержать:
- Главную проблему
- Ключевые уточнения
- Согласованное решение`;

  const response = await llm.invoke(prompt);
  return response.content.toString();
}

// Генерация краткого описания нового процесса
async function generateProcessDescription(
  businessData: BusinessData,
  bottleneck: Bottleneck,
  dialogState: DialogState,
  solution: string
): Promise<string> {
  const llm = createLLM();
  
  const messagesText = dialogState.messages
    .map(m => `${m.role === 'user' ? 'Пользователь' : 'Консультант'}: ${m.content}`)
    .join('\n\n');
  
  const prompt = `На основе диалога создай краткое описание нового процесса (2-3 абзаца).

БИЗНЕС:
${businessData.productDescription}
Команда: ${businessData.teamSize}
KPI: ${businessData.kpis}

УЗКОЕ МЕСТО:
${bottleneck.title}
${bottleneck.problemDescription}

СОГЛАСОВАННОЕ РЕШЕНИЕ:
${solution}

ДИАЛОГ:
${messagesText}

Создай структурированное описание нового процесса:
1. Как процесс будет работать (пошагово)
2. Кто участвует и какие роли
3. Какие инструменты и сервисы используются
4. Какие результаты ожидаются

Формат: структурированный текст на русском языке, 2-3 абзаца.`;

  const response = await llm.invoke(prompt);
  return response.content.toString();
}

// Генерация технического задания на сервис
async function generateTechnicalSpec(
  businessData: BusinessData,
  bottleneck: Bottleneck,
  dialogState: DialogState,
  solution: string
): Promise<string> {
  const llm = createLLM();
  
  const messagesText = dialogState.messages
    .map(m => `${m.role === 'user' ? 'Пользователь' : 'Консультант'}: ${m.content}`)
    .join('\n\n');
  
  const prompt = `На основе диалога создай техническое задание на создание сервиса для улучшения процесса.

БИЗНЕС:
${businessData.productDescription}
Команда: ${businessData.teamSize}
KPI: ${businessData.kpis}

УЗКОЕ МЕСТО:
${bottleneck.title}
${bottleneck.problemDescription}

СОГЛАСОВАННОЕ РЕШЕНИЕ:
${solution}

ДИАЛОГ:
${messagesText}

Создай детальное техническое задание, включающее:

1. НАЗНАЧЕНИЕ СЕРВИСА
   - Цель и задачи сервиса
   - Решаемая проблема

2. ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ
   - Основные функции сервиса
   - Пользовательские сценарии
   - Входные и выходные данные

3. ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ
   - Архитектура решения
   - Необходимые агенты и их функции
   - Интеграции с внешними системами
   - Требования к производительности

4. ИНТЕРФЕЙСЫ И API
   - Описание API (если нужно)
   - Форматы данных
   - Протоколы взаимодействия

5. ЭТАПЫ РАЗРАБОТКИ
   - Приоритизация функций
   - План реализации по этапам

6. КРИТЕРИИ ПРИЕМКИ
   - Метрики успеха
   - Условия готовности

Формат: структурированный документ на русском языке.`;

  const response = await llm.invoke(prompt);
  return response.content.toString();
}

// Инициализация диалога - первое сообщение от агента
export async function initializeDialog(
  businessData: BusinessData,
  bottleneck: Bottleneck
): Promise<DialogState> {
  const llm = createLLM();
  
  const prompt = `Ты — эксперт-консультант по оптимизации бизнес-процессов. 
Начни диалог с пользователем для детального понимания текущего процесса (AS-IS) и проектирования улучшенного процесса (TO-BE).

БИЗНЕС:
Продукт: ${businessData.productDescription}
Команда: ${businessData.teamSize} человек
Процессы: ${businessData.workflows}
KPI: ${businessData.kpis}

УЛУЧШЕНИЕ ПРОЦЕССА (первичный анализ):
Название: ${bottleneck.title}
Область: ${bottleneck.processArea}
Проблема: ${bottleneck.problemDescription}
Текущее влияние: ${bottleneck.currentImpact}

ТВОЯ ЗАДАЧА:
Напиши приветственное сообщение, в котором:
1. Покажи что понимаешь контекст и выявленную проблему
2. Объясни, что вы вместе будете детально разбирать текущий процесс (AS-IS), а затем проектировать улучшенный процесс (TO-BE)
3. Задай первый вопрос о том, как процесс работает сейчас

Будь дружелюбным и профессиональным. Пиши на русском.`;

  const response = await llm.invoke(prompt);
  
  const initialMessage: ChatMessage = {
    id: uuidv4(),
    role: 'assistant',
    content: response.content.toString(),
    timestamp: new Date().toISOString(),
    phase: 'clarifying',
  };
  
  return {
    bottleneckId: bottleneck.id,
    phase: 'clarifying',
    messages: [initialMessage],
    insights: [],
    clarifications: [],
    proposedSolution: null,
    isComplete: false,
  };
}


