# Развертывание системы в интернете

Это руководство поможет вам развернуть систему анализа узких мест в интернете для демонстрации внешним пользователям.

## Быстрый старт (Vercel - рекомендуется)

Vercel - самый простой способ развернуть Next.js приложение.

### Шаг 1: Подготовка

1. Убедитесь, что у вас есть:
   - Аккаунт на [Vercel](https://vercel.com) (бесплатный)
   - Аккаунт на [OpenAI](https://platform.openai.com) с API ключом
   - Git репозиторий (GitHub, GitLab или Bitbucket)

2. Создайте файл `.env.local` (не коммитьте его в Git!):
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Шаг 2: Деплой на Vercel

#### Вариант A: Через веб-интерфейс (самый простой)

1. Зайдите на [vercel.com](https://vercel.com) и войдите через GitHub/GitLab
2. Нажмите "Add New Project"
3. Импортируйте ваш репозиторий
4. В настройках проекта:
   - **Framework Preset**: Next.js (определится автоматически)
   - **Root Directory**: `business-bottleneck-analyzer` (если проект в подпапке)
   - **Environment Variables**: Добавьте `OPENAI_API_KEY` со значением вашего ключа
5. Нажмите "Deploy"
6. Через 2-3 минуты получите публичную ссылку вида: `https://your-project.vercel.app`

#### Вариант B: Через CLI

```bash
# Установите Vercel CLI
npm i -g vercel

# Перейдите в директорию проекта
cd business-bottleneck-analyzer

# Войдите в Vercel
vercel login

# Деплой
vercel

# Для production деплоя
vercel --prod
```

### Шаг 3: Настройка переменных окружения

В Vercel Dashboard:
1. Перейдите в Settings → Environment Variables
2. Добавьте:
   - `OPENAI_API_KEY` = ваш ключ OpenAI
3. Передеплойте проект (Deployments → ... → Redeploy)

## Альтернативные платформы

### Railway

1. Зайдите на [railway.app](https://railway.app)
2. Создайте новый проект из GitHub репозитория
3. Добавьте переменную окружения `OPENAI_API_KEY`
4. Railway автоматически определит Next.js и задеплоит

### Render

1. Зайдите на [render.com](https://render.com)
2. Создайте новый Web Service
3. Подключите GitHub репозиторий
4. Настройки:
   - **Build Command**: `cd business-bottleneck-analyzer && npm install && npm run build`
   - **Start Command**: `cd business-bottleneck-analyzer && npm start`
   - **Environment**: Node
5. Добавьте переменную окружения `OPENAI_API_KEY`

### Docker (для собственного сервера)

Создайте `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Экспонируем порт
EXPOSE 3000

# Запускаем
CMD ["npm", "start"]
```

И `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped
```

Запуск:
```bash
docker-compose up -d
```

## Настройка для продакшена

### 1. Обновление next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Для продакшена
  output: 'standalone', // Опционально, для Docker
}

module.exports = nextConfig
```

### 2. Создание .env.example

Создайте файл `.env.example` (можно коммитить):

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Настройка CORS (если нужно)

Если планируете использовать API с других доменов, добавьте в `next.config.js`:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
        ],
      },
    ]
  },
}
```

## Проверка деплоя

После деплоя проверьте:

1. ✅ Главная страница открывается
2. ✅ Форма Discovery работает
3. ✅ Мультиагентная система инициализируется
4. ✅ API endpoints отвечают (проверьте в Network tab браузера)

## Безопасность

⚠️ **Важно:**

1. **Никогда не коммитьте `.env.local`** - добавьте в `.gitignore`
2. Используйте переменные окружения на платформе деплоя
3. Ограничьте доступ к API ключу OpenAI (используйте rate limits)
4. Рассмотрите добавление аутентификации для продакшена

## Мониторинг и логи

### Vercel
- Логи доступны в Dashboard → Deployments → выберите деплой → Logs
- Analytics включены автоматически

### Railway
- Логи в реальном времени в Dashboard
- Можно настроить алерты

## Обновление приложения

После изменений в коде:

1. Закоммитьте изменения в Git
2. Платформа автоматически задеплоит новую версию
3. Или запустите деплой вручную через CLI/UI

## Troubleshooting

### Ошибка: "OPENAI_API_KEY is not defined"
- Проверьте, что переменная окружения добавлена на платформе
- Перезапустите деплой после добавления переменных

### Ошибка: "Module not found"
- Убедитесь, что все зависимости в `package.json`
- Проверьте, что `npm install` выполняется при сборке

### Приложение не запускается
- Проверьте логи деплоя
- Убедитесь, что порт 3000 доступен
- Проверьте, что `npm run build` проходит успешно локально

## Стоимость

### Vercel (Hobby - бесплатно)
- ✅ Бесплатно для личных проектов
- ✅ Автоматические деплои
- ✅ SSL сертификаты
- ⚠️ Ограничения: 100GB bandwidth/месяц

### Railway (Starter - $5/месяц)
- ✅ Простое управление
- ✅ Автоматические деплои
- ✅ $5 кредитов бесплатно каждый месяц

### Render (Free tier)
- ✅ Бесплатно для статических сайтов
- ⚠️ Web Services спят после 15 минут бездействия

## Демонстрация

После успешного деплоя вы получите публичную ссылку, которую можно:
- Поделиться с клиентами/коллегами
- Добавить в портфолио
- Использовать для тестирования

Пример ссылки: `https://bottleneck-analyzer.vercel.app`

---

**Рекомендация**: Начните с Vercel - это самый простой и быстрый способ для Next.js приложений.

