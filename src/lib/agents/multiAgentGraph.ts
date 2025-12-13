import { MultiAgentState, MultiAgentPhase, BusinessData, ValueChainMap, Bottleneck } from '@/types';
import { ManagerAgent } from './managerAgent';
import { ProcessMiningAgent } from './processMiningAgent';
import { BottleneckAgent } from './bottleneckAgent';
import { RedesignAgent } from './redesignAgent';

/**
 * Граф мультиагентной системы для анализа цепочки ценности
 * 
 * Фазы:
 * 1. initialization - Manager задает вопросы для сегментации
 * 2. process_mapping - Process Mining создает карту процессов
 * 3. bottleneck_analysis - Bottleneck Agent находит узкие места
 * 4. solution_design - Redesign Agent предлагает решения
 * 5. complete - Завершено
 */
export class MultiAgentGraph {
  private managerAgent: ManagerAgent;
  private processMiningAgent: ProcessMiningAgent;
  private bottleneckAgent: BottleneckAgent;
  private redesignAgent: RedesignAgent;

  constructor() {
    this.managerAgent = new ManagerAgent();
    this.processMiningAgent = new ProcessMiningAgent();
    this.bottleneckAgent = new BottleneckAgent();
    this.redesignAgent = new RedesignAgent();
  }

  /**
   * Инициализация системы - начать диалог
   */
  async initialize(businessData: BusinessData): Promise<MultiAgentState> {
    const result = await this.managerAgent.initializeDialog(businessData);

    const state: MultiAgentState = {
      phase: 'initialization',
      businessData,
      valueChainMap: null,
      agentMessages: [result.agentMessage],
      currentQuestion: result.question,
      collectedAnswers: {},
      bottlenecks: [],
      isComplete: false,
      thinking: '',
    };

    return state;
  }

  /**
   * Обработать ответ пользователя и перейти к следующему шагу
   */
  async processUserAnswer(
    state: MultiAgentState,
    userAnswer: string
  ): Promise<MultiAgentState> {
    // Сохраняем ответ пользователя с временной меткой
    const answerKey = `answer_${Object.keys(state.collectedAnswers).length + 1}`;
    const answerTimestamp = new Date().toISOString();
    const updatedAnswers = {
      ...state.collectedAnswers,
      [answerKey]: {
        answer: userAnswer,
        timestamp: answerTimestamp,
      },
    };

    let updatedState: MultiAgentState = {
      ...state,
      collectedAnswers: updatedAnswers,
    };

    // В зависимости от фазы обрабатываем по-разному
    switch (state.phase) {
      case 'initialization':
        // Manager продолжает задавать вопросы или переходит к следующей фазе
        try {
          const managerResult = await this.managerAgent.continueDialog(
            updatedState,
            userAnswer
          );

          // Создаем сообщение агента с временной меткой после ответа пользователя
          const agentMessageWithTimestamp = {
            ...managerResult.agentMessage,
            timestamp: new Date().toISOString(), // Время после ответа пользователя
          };

          updatedState = {
            ...updatedState,
            agentMessages: [...updatedState.agentMessages, agentMessageWithTimestamp],
            currentQuestion: managerResult.question,
            thinking: managerResult.thinking,
          };

          // Если Manager решил перейти к следующей фазе
          if (managerResult.shouldAdvancePhase && managerResult.nextPhase) {
            updatedState.phase = managerResult.nextPhase;
            updatedState.currentQuestion = null;

            // Автоматически запускаем следующую фазу
            if (managerResult.nextPhase === 'process_mapping') {
              updatedState = await this.processMappingPhase(updatedState);
            }
          }
        } catch (error: any) {
          console.error('Error in manager dialog:', error);
          // В случае ошибки все равно возвращаем состояние с сообщением об ошибке
          updatedState.thinking = `Ошибка обработки: ${error.message}`;
          updatedState.currentQuestion = 'Извините, произошла ошибка. Попробуйте переформулировать ответ.';
        }
        break;

      case 'process_mapping':
        // Если есть дополнительная информация, уточняем карту
        if (userAnswer.trim().toLowerCase() !== 'да' && userAnswer.trim().toLowerCase() !== 'продолжить') {
          if (updatedState.valueChainMap) {
            const refinedMap = await this.processMiningAgent.refineProcessMap(
              updatedState.valueChainMap,
              userAnswer
            );
            updatedState.valueChainMap = refinedMap;
          } else {
            // Если карты еще нет, создаем ее
            const mappingResult = await this.processMiningAgent.createProcessMap(
              updatedState.businessData,
              updatedState.collectedAnswers
            );
            updatedState.valueChainMap = mappingResult.valueChainMap;
            updatedState.agentMessages = [...updatedState.agentMessages, mappingResult.agentMessage];
          }
        }
        // Переходим к анализу узких мест
        updatedState = await this.bottleneckAnalysisPhase(updatedState);
        break;

      case 'bottleneck_analysis':
        // Переходим к проектированию решений
        updatedState = await this.solutionDesignPhase(updatedState);
        break;

      case 'solution_design':
        // Завершаем работу
        updatedState.isComplete = true;
        updatedState.phase = 'complete';
        break;

      default:
        break;
    }

    return updatedState;
  }

  /**
   * Фаза построения карты процессов
   */
  private async processMappingPhase(state: MultiAgentState): Promise<MultiAgentState> {
    const result = await this.processMiningAgent.createProcessMap(
      state.businessData,
      state.collectedAnswers
    );

    return {
      ...state,
      valueChainMap: result.valueChainMap,
      agentMessages: [...state.agentMessages, result.agentMessage],
      thinking: 'Карта процессов создана. Переходим к анализу узких мест.',
    };
  }

  /**
   * Фаза анализа узких мест
   */
  private async bottleneckAnalysisPhase(state: MultiAgentState): Promise<MultiAgentState> {
    if (!state.valueChainMap) {
      // Если карты нет, создаем ее сначала
      const mappingResult = await this.processMiningAgent.createProcessMap(
        state.businessData,
        state.collectedAnswers
      );
      state.valueChainMap = mappingResult.valueChainMap;
      state.agentMessages = [...state.agentMessages, mappingResult.agentMessage];
    }

    const result = await this.bottleneckAgent.findBottlenecks(state.valueChainMap!);

    return {
      ...state,
      valueChainMap: result.updatedMap,
      bottlenecks: result.bottlenecks,
      agentMessages: [...state.agentMessages, result.agentMessage],
      phase: 'bottleneck_analysis',
      thinking: `Найдено ${result.bottlenecks.length} узких мест. Переходим к проектированию решений.`,
    };
  }

  /**
   * Фаза проектирования решений
   */
  private async solutionDesignPhase(state: MultiAgentState): Promise<MultiAgentState> {
    if (state.bottlenecks.length === 0) {
      // Если узких мест нет, завершаем
      return {
        ...state,
        phase: 'complete',
        isComplete: true,
        thinking: 'Узких мест не найдено. Анализ завершен.',
      };
    }

    const result = await this.redesignAgent.proposeSolutions(
      state.bottlenecks,
      state.valueChainMap!
    );

    // Сохраняем решения в метаданные узких мест
    const updatedBottlenecks = state.bottlenecks.map((bottleneck) => {
      const solution = result.solutions.find((s) => s.bottleneckId === bottleneck.id);
      return {
        ...bottleneck,
        // Добавляем решение в метаданные (можно расширить тип Bottleneck)
      };
    });

    return {
      ...state,
      bottlenecks: updatedBottlenecks,
      agentMessages: [...state.agentMessages, result.agentMessage],
      phase: 'solution_design',
      thinking: `Предложены решения для ${result.solutions.length} узких мест.`,
    };
  }

  /**
   * Получить текущее состояние
   */
  getState(): MultiAgentState | null {
    return null; // Состояние должно храниться на стороне клиента/сервера
  }

  /**
   * Продолжить работу после паузы (например, после ответа пользователя)
   */
  async continue(state: MultiAgentState): Promise<MultiAgentState> {
    // Автоматически переходим к следующей фазе, если нужно
    switch (state.phase) {
      case 'process_mapping':
        if (state.valueChainMap) {
          return await this.bottleneckAnalysisPhase(state);
        }
        break;

      case 'bottleneck_analysis':
        if (state.bottlenecks.length > 0) {
          return await this.solutionDesignPhase(state);
        }
        break;

      case 'solution_design':
        return {
          ...state,
          phase: 'complete',
          isComplete: true,
        };

      default:
        break;
    }

    return state;
  }
}

