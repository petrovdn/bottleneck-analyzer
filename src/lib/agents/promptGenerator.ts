import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { BusinessData, Bottleneck, RefinedBottleneck } from '@/types';

const PROMPT_GENERATION_TEMPLATE = `Ты — эксперт по созданию мультиагентных систем и промптов для разработки в Cursor.

Твоя задача — создать полный, готовый к использованию промпт для реализации мультиагента, который решит конкретное узкое место в бизнесе.

КОНТЕКСТ БИЗНЕСА:
Продукт/услуга: {productDescription}
Размер команды: {teamSize} человек
Основные потоки: {workflows}
Целевые KPI: {kpis}

ВЫБРАННОЕ УЗКОЕ МЕСТО:
Название: {bottleneckTitle}
Область процесса: {processArea}
Проблема: {problemDescription}
Текущее влияние: {currentImpact}
Потенциальный выигрыш: {potentialGain}

ТЕКУЩИЙ ПРОЦЕСС (AS-IS):
{asIsProcess}

ЦЕЛЕВОЙ ПРОЦЕСС (TO-BE):
{toBeProcess}

{refinedSection}

ПРЕДЛОЖЕННЫЕ АГЕНТЫ:
{suggestedAgents}

MCP ИНСТРУМЕНТЫ:
{mcpTools}

СОЗДАЙ ПОЛНЫЙ ПРОМПТ ДЛЯ CURSOR, КОТОРЫЙ ВКЛЮЧАЕТ:

# Контекст проекта

## Бизнес
[Краткое описание бизнеса и проблемы]

## Выбранное узкое место
[Детальное описание проблемы и её влияния]

## Целевые KPI
[Что должно улучшиться после внедрения]

---

# Архитектура мультиагента

## Агенты
[Полный список агентов с детальным описанием их ролей и ответственности]

## Граф оркестрации
[Как агенты взаимодействуют: кто кого вызывает, в каком порядке]

## Инструменты и MCPNext
[Какие действия доступны через MCP: отправка email, работа с CRM, API вызовы и т.д.]

---

# Промпты для каждого агента

## Supervisor-агент
\`\`\`
[Полный системный промпт для супервизора]
\`\`\`

## [Название агента 2]
\`\`\`
[Полный системный промпт для агента 2]
\`\`\`

[И так для каждого агента...]

---

# Фронтовая часть (UI/UX)

## Экраны и компоненты
[Детальное описание UI:
- Какие экраны нужны
- Какие компоненты на каждом экране
- Какие данные показываются
- Какие действия доступны пользователю]

## API контракты
[Описание endpoints:
- POST /api/... - что принимает, что возвращает
- GET /api/... - и т.д.]

## Пример данных
\`\`\`json
{{
  "example": "структура данных"
}}
\`\`\`

---

# Инструкции по реализации в Cursor

1. **Начать с создания Next.js проекта**
   - npx create-next-app@latest
   - Установить зависимости: @langchain/openai, langchain и т.д.

2. **Создать мультиагентную систему**
   - Реализовать каждого агента в отдельном файле
   - Настроить граф оркестрации
   - Подключить MCP инструменты

3. **Реализовать фронтенд**
   - Создать компоненты для каждого экрана
   - Подключить состояние (zustand/redux)
   - Стилизовать с помощью TailwindCSS

4. **Интегрировать с бэкендом**
   - Создать API routes
   - Подключить агентов к endpoints
   - Добавить обработку ошибок

5. **Тестирование**
   - Проверить каждый flow
   - Убедиться что KPI улучшаются

---

# Технический стек
- Frontend: Next.js 14, React, TypeScript, TailwindCSS
- Backend: Next.js API Routes, Node.js
- AI: LangChain, OpenAI GPT-4
- State: Zustand
- MCP: [конкретные инструменты]

---

ВАЖНО:
- Промпт должен быть настолько детальным, чтобы разработчик мог сразу начать кодить
- Включи примеры кода где необходимо
- Будь конкретным про UI/UX
- Опиши граф агентов визуально
- Дай полные системные промпты для каждого агента
- Укажи конкретные метрики успеха`;

export async function generateImplementationPrompt(
  businessData: BusinessData,
  bottleneck: Bottleneck,
  refinedBottleneck?: RefinedBottleneck
): Promise<string> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 4000,
  });

  const prompt = PromptTemplate.fromTemplate(PROMPT_GENERATION_TEMPLATE);

  // Формируем секцию уточнений если есть refined bottleneck
  let refinedSection = '';
  if (refinedBottleneck) {
    refinedSection = `
УТОЧНЕНИЯ ИЗ ДИАЛОГА С ПОЛЬЗОВАТЕЛЕМ:
${refinedBottleneck.userClarifications.map((c, i) => `${i + 1}. ${c}`).join('\n')}

СОГЛАСОВАННОЕ РЕШЕНИЕ:
${refinedBottleneck.agreedSolution}

ДЕТАЛИ РЕАЛИЗАЦИИ (из обсуждения):
${refinedBottleneck.implementationDetails}

РЕЗЮМЕ ДИАЛОГА:
${refinedBottleneck.dialogSummary}

ВАЖНО: Учитывай все уточнения из диалога при создании промпта. Пользователь уже обсудил детали и ожидает решение, соответствующее согласованному плану.
`;
  }

  const formattedPrompt = await prompt.format({
    productDescription: businessData.productDescription,
    teamSize: businessData.teamSize,
    workflows: businessData.workflows,
    kpis: businessData.kpis,
    bottleneckTitle: bottleneck.title,
    processArea: bottleneck.processArea,
    problemDescription: bottleneck.problemDescription,
    currentImpact: bottleneck.currentImpact,
    potentialGain: bottleneck.potentialGain,
    asIsProcess: bottleneck.asIsProcess,
    toBeProcess: refinedBottleneck?.agreedSolution || bottleneck.toBeProcess,
    refinedSection: refinedSection,
    suggestedAgents: bottleneck.suggestedAgents.join(', '),
    mcpTools: bottleneck.mcpToolsNeeded.join(', ') || 'Не требуются',
  });

  const response = await model.invoke(formattedPrompt);
  
  return response.content.toString();
}

