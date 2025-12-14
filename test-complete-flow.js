/**
 * Тест завершения диалога и генерации ТЗ
 */

const API_BASE = 'http://localhost:3000';

const businessData = {
  productDescription: 'SaaS платформа для управления проектами',
  teamSize: 25,
  workflows: 'Привлечение лидов, продажи, онбординг клиентов',
  kpis: 'MRR, Churn Rate, Conversion Rate'
};

const bottleneck = {
  id: 'test_bottleneck_1',
  title: 'Задержки в работе с клиентом и заключении договора',
  processArea: 'Работа с клиентом и заключение договора',
  problemDescription: 'Процесс занимает от 7 до 14 дней',
  currentImpact: 'Увеличение цикла продаж',
  priority: 'high',
  potentialGain: 'Ускорение процесса продаж',
  asIsProcess: 'Менеджер взаимодействует с клиентом вручную',
  toBeProcess: 'Автоматизация через CRM',
  suggestedAgents: ['CRM система'],
  mcpToolsNeeded: ['Salesforce']
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Ошибка ${endpoint}:`, data);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Ошибка запроса ${endpoint}:`, error.message);
    return null;
  }
}

async function testCompleteFlow() {
  console.log('🚀 Тестирование полного цикла до генерации ТЗ...\n');
  
  // Инициализация диалога
  console.log('1️⃣ Инициализация диалога...');
  let result = await testAPI('/api/chat/init', 'POST', {
    businessData,
    bottleneck
  });
  
  if (!result || !result.dialogState) {
    console.error('❌ Не удалось инициализировать диалог');
    return;
  }
  
  let dialogState = result.dialogState;
  console.log(`✅ Диалог начат. Фаза: ${dialogState.phase}\n`);
  
  // Полный цикл диалога
  const messages = [
    // AS-IS фаза
    'Сейчас процесс такой: менеджер получает лид, звонит клиенту, проводит встречу, готовит КП, согласовывает условия, отправляет договор. Занимает 7-14 дней.',
    'Основные проблемы: долгое согласование условий, ручная подготовка документов, отсутствие автоматизации.',
    'Да, используем CRM, но она не интегрирована с другими системами. Все делается вручную.',
    
    // TO-BE фаза
    'Хотим автоматизировать: генерацию КП и договоров, онлайн-подписание, интеграцию CRM с другими системами.',
    'Идеальный процесс: лид → автоматическое создание в CRM → одна встреча → автоматическая генерация документов → онлайн-подписание. Все за 2-3 дня.',
    
    // Решение
    'Да, это правильное направление. Нужна система автоматизации документооборота и интеграция с CRM.',
    'Начнем с автоматизации генерации документов и онлайн-подписания. Это даст быстрый эффект.',
    
    // ТЗ
    'Да, согласен. Нужно: API для генерации документов, интеграция с CRM, модуль онлайн-подписания, уведомления менеджерам.'
  ];
  
  for (let i = 0; i < messages.length; i++) {
    console.log(`💬 Сообщение ${i + 1}/${messages.length}: ${messages[i].substring(0, 50)}...`);
    
    result = await testAPI('/api/chat', 'POST', {
      businessData,
      bottleneck,
      dialogState,
      userMessage: messages[i]
    });
    
    if (result) {
      dialogState = result.updatedDialogState;
      console.log(`   ✅ Фаза: ${dialogState.phase}`);
      
      if (result.updatedBottleneck) {
        const updates = Object.keys(result.updatedBottleneck);
        console.log(`   📝 Обновления карточки: ${updates.join(', ')}`);
      }
      
      if (result.refinedBottleneck) {
        console.log(`\n🎉 ДИАЛОГ ЗАВЕРШЕН!`);
        console.log(`\n📋 Результаты:`);
        console.log(`   ✅ Описание процесса: ${result.refinedBottleneck.processDescription ? '✓' : '✗'}`);
        console.log(`   ✅ Техническое задание: ${result.refinedBottleneck.technicalSpec ? '✓' : '✗'}`);
        console.log(`   ✅ Согласованное решение: ${result.refinedBottleneck.agreedSolution ? '✓' : '✗'}`);
        
        if (result.refinedBottleneck.processDescription) {
          console.log(`\n📄 Описание процесса (первые 200 символов):`);
          console.log(result.refinedBottleneck.processDescription.substring(0, 200) + '...');
        }
        
        if (result.refinedBottleneck.technicalSpec) {
          console.log(`\n📄 ТЗ (первые 300 символов):`);
          console.log(result.refinedBottleneck.technicalSpec.substring(0, 300) + '...');
        }
        
        break;
      }
      
      await sleep(2000);
    }
  }
  
  console.log(`\n📊 Финальная статистика:`);
  console.log(`   Фаза: ${dialogState.phase}`);
  console.log(`   Завершен: ${dialogState.isComplete ? '✅' : '❌'}`);
  console.log(`   Сообщений: ${dialogState.messages.length}`);
  console.log(`   Инсайтов: ${dialogState.insights.length}`);
  
  if (!dialogState.isComplete) {
    console.log(`\n⚠️  Диалог не завершен. Возможно, нужно больше сообщений для завершения.`);
  }
}

testCompleteFlow().catch(console.error);

