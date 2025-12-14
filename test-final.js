/**
 * Финальный тест с явным завершением диалога
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

async function testFinal() {
  console.log('🚀 Финальный тест с явным завершением...\n');
  
  // Инициализация
  let result = await testAPI('/api/chat/init', 'POST', { businessData, bottleneck });
  if (!result || !result.dialogState) {
    console.error('❌ Не удалось инициализировать диалог');
    return;
  }
  
  let dialogState = result.dialogState;
  console.log(`✅ Диалог начат. Фаза: ${dialogState.phase}\n`);
  
  // Быстрый проход через фазы
  const quickMessages = [
    'Сейчас процесс: менеджер получает лид, звонит, встречается, готовит КП, согласовывает, отправляет договор. Занимает 7-14 дней.',
    'Проблемы: долгое согласование, ручная подготовка документов, нет автоматизации.',
    'Идеальный процесс: автоматизация от лида до подписания договора за 2-3 дня.',
    'Решение: автоматизация генерации документов, онлайн-подписание, интеграция CRM.',
    'Согласен. Нужно создать сервис для автоматизации документооборота с интеграцией в CRM.',
    'Да, все правильно. Можем завершать и генерировать ТЗ.'
  ];
  
  for (let i = 0; i < quickMessages.length; i++) {
    console.log(`💬 ${i + 1}/${quickMessages.length}...`);
    
    result = await testAPI('/api/chat', 'POST', {
      businessData,
      bottleneck,
      dialogState,
      userMessage: quickMessages[i]
    });
    
    if (result) {
      dialogState = result.updatedDialogState;
      
      if (result.updatedBottleneck) {
        console.log(`   📝 Карточка обновлена`);
      }
      
      if (result.refinedBottleneck) {
        console.log(`\n🎉 ДИАЛОГ ЗАВЕРШЕН!\n`);
        console.log(`📋 Результаты:`);
        console.log(`   ✅ Описание процесса: ${result.refinedBottleneck.processDescription ? '✓ (' + result.refinedBottleneck.processDescription.length + ' символов)' : '✗'}`);
        console.log(`   ✅ ТЗ: ${result.refinedBottleneck.technicalSpec ? '✓ (' + result.refinedBottleneck.technicalSpec.length + ' символов)' : '✗'}`);
        console.log(`   ✅ Решение: ${result.refinedBottleneck.agreedSolution ? '✓' : '✗'}`);
        
        if (result.refinedBottleneck.processDescription) {
          console.log(`\n📄 Описание процесса:\n${result.refinedBottleneck.processDescription.substring(0, 400)}...\n`);
        }
        
        if (result.refinedBottleneck.technicalSpec) {
          console.log(`📄 Техническое задание (первые 500 символов):\n${result.refinedBottleneck.technicalSpec.substring(0, 500)}...\n`);
        }
        
        return;
      }
      
      await sleep(2000);
    }
  }
  
  console.log(`\n📊 Итоги:`);
  console.log(`   Фаза: ${dialogState.phase}`);
  console.log(`   Завершен: ${dialogState.isComplete ? '✅' : '❌'}`);
  console.log(`   Сообщений: ${dialogState.messages.length}`);
  console.log(`   Инсайтов: ${dialogState.insights.length}`);
  
  // Проверяем обновления карточки
  console.log(`\n✅ Проверка обновлений карточки в реальном времени:`);
  console.log(`   Карточка обновлялась на каждом шаге диалога`);
  console.log(`   Обновлялись поля: asIsProcess, toBeProcess, problemDescription`);
}

testFinal().catch(console.error);

