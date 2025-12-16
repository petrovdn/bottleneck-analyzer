import {
  Bottleneck,
  DialogState,
  RefinedBottleneck,
  BusinessData,
  MultiAgentState,
  SingleBottleneckExport,
  FullExport,
  ExportData,
} from '@/types';

/**
 * Экспорт одной точки улучшения с диалогом и уточненными данными
 */
export function exportSingleBottleneck(
  bottleneck: Bottleneck,
  dialogState: DialogState | null,
  refinedBottleneck: RefinedBottleneck | null
): SingleBottleneckExport {
  return {
    type: 'single_bottleneck',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    bottleneck,
    dialogState,
    refinedBottleneck,
  };
}

/**
 * Экспорт всех данных из store
 */
export function exportFullData(store: {
  businessData: BusinessData | null;
  multiAgentState: MultiAgentState | null;
  bottlenecks: Bottleneck[];
  dialogStates: Map<string, DialogState> | Record<string, DialogState>;
  refinedBottlenecks: Map<string, RefinedBottleneck> | Record<string, RefinedBottleneck>;
}): FullExport {
  // Преобразуем Map в Record для сериализации
  const dialogStatesRecord: Record<string, DialogState> = {};
  if (store.dialogStates instanceof Map) {
    store.dialogStates.forEach((value, key) => {
      dialogStatesRecord[key] = value;
    });
  } else {
    Object.assign(dialogStatesRecord, store.dialogStates);
  }

  const refinedBottlenecksRecord: Record<string, RefinedBottleneck> = {};
  if (store.refinedBottlenecks instanceof Map) {
    store.refinedBottlenecks.forEach((value, key) => {
      refinedBottlenecksRecord[key] = value;
    });
  } else {
    Object.assign(refinedBottlenecksRecord, store.refinedBottlenecks);
  }

  return {
    type: 'full_export',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    businessData: store.businessData,
    multiAgentState: store.multiAgentState,
    bottlenecks: store.bottlenecks,
    dialogStates: dialogStatesRecord,
    refinedBottlenecks: refinedBottlenecksRecord,
  };
}

/**
 * Валидация импортируемых данных
 */
export function validateImportData(data: any): { valid: boolean; error?: string; exportData?: ExportData } {
  try {
    // Проверка базовой структуры
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Данные должны быть объектом JSON' };
    }

    // Проверка обязательных полей
    if (!data.type || !data.version || !data.exportedAt) {
      return { valid: false, error: 'Отсутствуют обязательные поля: type, version, exportedAt' };
    }

    // Проверка версии
    if (data.version !== '1.0') {
      return { valid: false, error: `Неподдерживаемая версия: ${data.version}. Ожидается версия 1.0` };
    }

    // Проверка типа
    if (data.type === 'single_bottleneck') {
      if (!data.bottleneck) {
        return { valid: false, error: 'Отсутствует поле bottleneck' };
      }
      // Базовые проверки структуры bottleneck
      if (!data.bottleneck.id || !data.bottleneck.title) {
        return { valid: false, error: 'Некорректная структура bottleneck (отсутствуют id или title)' };
      }
      return { valid: true, exportData: data as SingleBottleneckExport };
    } else if (data.type === 'full_export') {
      if (!Array.isArray(data.bottlenecks)) {
        return { valid: false, error: 'Поле bottlenecks должно быть массивом' };
      }
      if (typeof data.dialogStates !== 'object' || data.dialogStates === null) {
        return { valid: false, error: 'Поле dialogStates должно быть объектом' };
      }
      if (typeof data.refinedBottlenecks !== 'object' || data.refinedBottlenecks === null) {
        return { valid: false, error: 'Поле refinedBottlenecks должно быть объектом' };
      }
      return { valid: true, exportData: data as FullExport };
    } else {
      return { valid: false, error: `Неизвестный тип экспорта: ${data.type}` };
    }
  } catch (error: any) {
    return { valid: false, error: `Ошибка валидации: ${error.message}` };
  }
}

/**
 * Парсинг одной точки улучшения из JSON
 */
export function importSingleBottleneck(jsonData: string): SingleBottleneckExport {
  const data = JSON.parse(jsonData);
  const validation = validateImportData(data);
  
  if (!validation.valid || validation.exportData?.type !== 'single_bottleneck') {
    throw new Error(validation.error || 'Некорректные данные для импорта одной точки');
  }
  
  return validation.exportData as SingleBottleneckExport;
}

/**
 * Парсинг полного экспорта из JSON
 */
export function importFullData(jsonData: string): FullExport {
  const data = JSON.parse(jsonData);
  const validation = validateImportData(data);
  
  if (!validation.valid || validation.exportData?.type !== 'full_export') {
    throw new Error(validation.error || 'Некорректные данные для полного импорта');
  }
  
  return validation.exportData as FullExport;
}

/**
 * Скачивание JSON файла
 */
export function downloadJSON(data: ExportData, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Чтение JSON из файла
 */
export function readJSONFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        // Проверяем, что это валидный JSON
        JSON.parse(text);
        resolve(text);
      } catch (error: any) {
        reject(new Error(`Ошибка чтения JSON: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Генерация имени файла для экспорта одной точки
 */
export function generateSingleBottleneckFilename(bottleneck: Bottleneck): string {
  const sanitizedTitle = bottleneck.title
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  const date = new Date().toISOString().split('T')[0];
  return `improvement-${sanitizedTitle}-${date}.json`;
}

/**
 * Генерация имени файла для полного экспорта
 */
export function generateFullExportFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `business-analysis-${date}.json`;
}

