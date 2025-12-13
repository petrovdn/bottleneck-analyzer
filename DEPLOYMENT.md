# 🚀 Руководство по деплою

Инструкции по развертыванию приложения в production.

## Варианты деплоя

1. **Vercel** (рекомендуется) - создатели Next.js, бесплатный план
2. **Netlify** - простой деплой с git интеграцией
3. **AWS Amplify** - для AWS инфраструктуры
4. **Railway** - простой деплой с базами данных
5. **DigitalOcean App Platform** - простота и контроль

---

## 1. Деплой на Vercel (Рекомендуется)

### Почему Vercel?
- ✅ Создатели Next.js - лучшая поддержка
- ✅ Бесплатный план (Hobby) - 100GB bandwidth
- ✅ Автоматический CI/CD из Git
- ✅ Edge functions для быстрых API
- ✅ Встроенная аналитика

### Шаги деплоя:

#### 1.1 Подготовка проекта

```bash
# Убедитесь что проект собирается без ошибок
npm run build

# Должно завершиться успешно
✓ Compiled successfully
```

#### 1.2 Создайте Git репозиторий (если еще не создан)

```bash
cd /Users/Dima/langchain-project/business-bottleneck-analyzer

# Инициализировать Git
git init

# Добавить все файлы
git add .

# Первый коммит
git commit -m "Initial commit: Business Bottleneck Analyzer"

# Создать репозиторий на GitHub
# Перейдите на github.com и создайте новый репозиторий

# Подключить remote
git remote add origin https://github.com/your-username/business-bottleneck-analyzer.git

# Пушнуть код
git push -u origin main
```

#### 1.3 Деплой на Vercel

**Вариант A: Через веб-интерфейс (проще)**

1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите "Sign Up" и войдите через GitHub
3. Нажмите "Add New Project"
4. Выберите ваш репозиторий
5. Vercel автоматически определит Next.js проект
6. Настройте Environment Variables:
   - Имя: `OPENAI_API_KEY`
   - Значение: ваш OpenAI API ключ
   - Environments: Production, Preview, Development
7. Нажмите "Deploy"

**Вариант B: Через CLI**

```bash
# Установить Vercel CLI
npm install -g vercel

# Войти в аккаунт
vercel login

# Деплой
vercel

# Следуйте инструкциям:
# - Set up and deploy? Y
# - Which scope? [ваш аккаунт]
# - Link to existing project? N
# - What's your project's name? business-bottleneck-analyzer
# - In which directory is your code located? ./
# - Want to override settings? N

# После первого деплоя, добавьте env переменные
vercel env add OPENAI_API_KEY

# Введите значение ключа и выберите окружения

# Редеплой с новыми переменными
vercel --prod
```

#### 1.4 Проверка деплоя

После успешного деплоя:
- Вы получите URL типа `https://business-bottleneck-analyzer.vercel.app`
- Откройте URL и проверьте работоспособность
- Заполните форму и убедитесь что анализ работает

#### 1.5 Настройка домена (опционально)

1. В Vercel dashboard откройте ваш проект
2. Перейдите в Settings → Domains
3. Добавьте свой домен
4. Настройте DNS записи по инструкции Vercel

---

## 2. Деплой на Netlify

### 2.1 Через веб-интерфейс

1. Перейдите на [netlify.com](https://netlify.com)
2. Нажмите "Add new site" → "Import an existing project"
3. Подключите GitHub и выберите репозиторий
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Environment variables:
   - `OPENAI_API_KEY`: ваш ключ
6. Deploy site

### 2.2 Через Netlify CLI

```bash
# Установить CLI
npm install -g netlify-cli

# Войти
netlify login

# Инициализировать проект
netlify init

# Деплой
netlify deploy --prod
```

---

## 3. Деплой на Railway

Railway отлично подходит если нужна база данных или другие сервисы.

### 3.1 Через веб-интерфейс

1. Перейдите на [railway.app](https://railway.app)
2. Нажмите "Start a New Project"
3. Выберите "Deploy from GitHub repo"
4. Выберите ваш репозиторий
5. Railway автоматически определит Next.js
6. Добавьте Environment Variables:
   - `OPENAI_API_KEY`
7. Deploy

### 3.2 Конфигурация Railway

Создайте файл `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 4. Деплой на собственном сервере (VPS)

### 4.1 Подготовка сервера

```bash
# Подключитесь к серверу
ssh user@your-server.com

# Установите Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установите PM2 (process manager)
sudo npm install -g pm2

# Установите Nginx (опционально, для reverse proxy)
sudo apt-get install nginx
```

### 4.2 Деплой приложения

```bash
# Клонировать репозиторий
git clone https://github.com/your-username/business-bottleneck-analyzer.git
cd business-bottleneck-analyzer

# Установить зависимости
npm install

# Создать .env.local
echo "OPENAI_API_KEY=your-key" > .env.local

# Собрать приложение
npm run build

# Запустить с PM2
pm2 start npm --name "bottleneck-analyzer" -- start

# Сохранить PM2 конфигурацию
pm2 save
pm2 startup
```

### 4.3 Настройка Nginx

Создайте `/etc/nginx/sites-available/bottleneck-analyzer`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/bottleneck-analyzer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4.4 SSL сертификат (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Environment Variables для Production

### Обязательные:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxx
```

### Опциональные:

```env
# URL приложения (для meta tags)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Модель OpenAI
OPENAI_MODEL=gpt-4-turbo-preview

# Температура для AI
OPENAI_TEMPERATURE=0.7

# Максимум токенов
OPENAI_MAX_TOKENS=4000

# Окружение
NODE_ENV=production
```

---

## CI/CD настройка

### GitHub Actions

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Build
        run: npm run build
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Мониторинг и логирование

### Vercel Analytics

Добавьте в `src/app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Sentry для error tracking

```bash
npm install @sentry/nextjs
```

Создайте `sentry.client.config.js`:

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

---

## Оптимизация для Production

### 1. Включите compression

В `next.config.js`:

```javascript
module.exports = {
  compress: true,
  // ... другие настройки
}
```

### 2. Настройте caching

```javascript
// src/app/api/analyze/route.ts
export const revalidate = 3600; // кэш на 1 час
```

### 3. Оптимизируйте изображения

Используйте `next/image` для всех картинок:

```tsx
import Image from 'next/image';

<Image 
  src="/logo.png" 
  width={200} 
  height={50} 
  alt="Logo"
/>
```

### 4. Добавьте rate limiting

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"),
});
```

---

## Безопасность в Production

### 1. Security Headers

В `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};
```

### 2. API Rate Limiting

Ограничьте количество запросов к API.

### 3. CORS настройка

Разрешайте запросы только с вашего домена.

### 4. Input Validation

Всегда валидируйте пользовательский ввод на сервере.

---

## Стоимость эксплуатации

### Хостинг:
- **Vercel Hobby**: $0/месяц (100GB bandwidth)
- **Vercel Pro**: $20/месяц (1TB bandwidth)
- **Railway**: от $5/месяц
- **VPS**: от $5/месяц

### OpenAI API:
- **GPT-4 Turbo**: $0.01 за 1K input tokens, $0.03 за 1K output tokens
- **Средняя сессия**: ~$0.20-0.30
- **100 сессий/месяц**: ~$20-30
- **1000 сессий/месяц**: ~$200-300

### Итого для старта:
- **0-100 пользователей**: $0-50/месяц
- **100-1000 пользователей**: $50-400/месяц

---

## Checklist перед деплоем

- [ ] Проект собирается без ошибок (`npm run build`)
- [ ] Все environment variables настроены
- [ ] .env.local добавлен в .gitignore
- [ ] OpenAI API ключ активен и имеет баланс
- [ ] Тестирование на production build (`npm start`)
- [ ] Security headers настроены
- [ ] Analytics подключена
- [ ] Error tracking настроен (Sentry)
- [ ] Мониторинг настроен
- [ ] Backup стратегия определена
- [ ] Документация обновлена

---

## Troubleshooting в Production

### Проблема: Build fails

**Решение:**
- Проверьте логи сборки
- Убедитесь что все dependencies установлены
- Проверьте environment variables

### Проблема: API errors в production

**Решение:**
- Проверьте OPENAI_API_KEY
- Убедитесь что ключ не expired
- Проверьте баланс OpenAI

### Проблема: Медленная работа

**Решение:**
- Включите caching
- Оптимизируйте изображения
- Используйте CDN
- Проверьте размер bundle

---

🚀 **Готово к деплою!** Выберите платформу и следуйте инструкциям выше.

