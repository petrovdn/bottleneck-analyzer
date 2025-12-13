import { ChatOpenAI } from '@langchain/openai';
import { ValueChainMap, Bottleneck, ProcessStep, AgentMessage, Priority } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const BOTTLENECK_AGENT_SYSTEM_PROMPT = `Ты — Bottleneck-агент, специализируешься на поиске узких мест в цепочке ценности.

ТВОЯ РОЛЬ:
- Анализировать карту процессов с метриками
- Искать узкие места: максимальная загрузка ресурса, очереди, шаги с длинным циклом, частыми переделками, задержками согласований
- Использовать шаблоны из литературы по value chain, Theory of Constraints и supply chain

КРИТЕРИИ УЗКИХ МЕСТ:
1. Этап с максимальным средним временем цикла и высокой вариативностью
2. Этап с максимальной загрузкой ключевого ресурса/человека (>80%)
3. Этап, где накапливается очередь (большое число объектов в работе)
4. Этап на критическом пути с наибольшим влиянием на throughput
5. Этап с высокой частотой проблем (>0.3)

ПРОВЕРКА ВЛИЯНИЯ НА THROUGHPUT:
- Оцени, насколько этап критичен для завершения заказа
- Определи, лежит ли он на критическом пути
- Оцени потенциальный эффект от улучшения

Будь точным и обоснованным. Пиши на русском языке.`;

export class BottleneckAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.3,
    });
  }

  /**
   * Найти узкие места в карте процессов
   */
  async findBottlenecks(
    valueChainMap: ValueChainMap
  ): Promise<{
    bottlenecks: Bottleneck[];
    agentMessage: AgentMessage;
    updatedMap: ValueChainMap;
  }> {
    const prompt = `${BOTTLENECK_AGENT_SYSTEM_PROMPT}

КАРТА ПРОЦЕССОВ:
${JSON.stringify(valueChainMap, null, 2)}

ТВОЯ ЗАДАЧА:
Проанализируй карту процессов и найди 3-5 критических узких мест.

Для каждого узкого места определи:
1. Название проблемы
2. Область процесса (какой этап затронут)
3. Детальное описание проблемы
4. Текущее влияние на бизнес
5. Приоритет (high/medium/low)
6. Потенциальный выигрыш от улучшения
7. Текущий процесс (as-is)
8. Предложенный процесс (to-be) - кратко
9. Список агентов для автоматизации (2-4 агента)
10. MCP инструменты (если нужны)

Верни результат в JSON формате:
{
  "bottlenecks": [
    {
      "title": "Краткое название узкого места",
      "processArea": "Название этапа",
      "problemDescription": "Детальное описание (2-3 предложения)",
      "currentImpact": "Влияние на KPI и бизнес",
      "priority": "high|medium|low",
      "potentialGain": "Потенциальный выигрыш",
      "asIsProcess": "Как работает сейчас (4-6 предложений)",
      "toBeProcess": "Как должен работать (4-6 предложений)",
      "suggestedAgents": ["Название агента 1", "Название агента 2"],
      "mcpToolsNeeded": ["tool1", "tool2"]
    }
  ],
  "bottleneckSteps": ["step_id_1", "step_id_2"] // ID этапов, которые являются узкими местами
}

ВАЖНО:
- Будь конкретным и практичным
- Фокусируйся на измеримых проблемах
- Предлагай реалистичные решения
- Приоритизируй по потенциальному ROI`;

    const response = await this.llm.invoke(prompt);
    const content = response.content.toString();

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const bottlenecks: Bottleneck[] = parsed.bottlenecks.map((b: any) => ({
          id: `bottleneck_${uuidv4()}`,
          title: b.title,
          processArea: b.processArea,
          problemDescription: b.problemDescription,
          currentImpact: b.currentImpact,
          priority: (b.priority as Priority) || 'medium',
          potentialGain: b.potentialGain,
          asIsProcess: b.asIsProcess,
          toBeProcess: b.toBeProcess,
          suggestedAgents: b.suggestedAgents || [],
          mcpToolsNeeded: b.mcpToolsNeeded || [],
        }));

        // Обновляем карту процессов - помечаем этапы как узкие места
        const updatedSteps = valueChainMap.steps.map((step) => {
          const isBottleneck = parsed.bottleneckSteps?.includes(step.id);
          return {
            ...step,
            isBottleneck,
            bottleneckReason: isBottleneck
              ? bottlenecks.find((b) => b.processArea === step.name)?.problemDescription
              : undefined,
          };
        });

        const updatedMap: ValueChainMap = {
          ...valueChainMap,
          steps: updatedSteps,
          updatedAt: new Date().toISOString(),
        };

        return {
          bottlenecks,
          agentMessage: {
            agentType: 'bottleneck_finder',
            content: `Найдено ${bottlenecks.length} узких мест:\n${bottlenecks
              .map((b, i) => `${i + 1}. ${b.title} (${b.priority})`)
              .join('\n')}`,
            timestamp: new Date().toISOString(),
            phase: 'bottleneck_analysis',
          },
          updatedMap,
        };
      }
    } catch (e) {
      console.error('Error parsing bottleneck analysis:', e);
    }

    // Fallback
    return {
      bottlenecks: [],
      agentMessage: {
        agentType: 'bottleneck_finder',
        content: 'Анализ узких мест завершен (требуется проверка)',
        timestamp: new Date().toISOString(),
        phase: 'bottleneck_analysis',
      },
      updatedMap: valueChainMap,
    };
  }
}

