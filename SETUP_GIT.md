# Настройка Git репозитория для деплоя

## Шаг 1: Создайте репозиторий на GitHub

1. Зайдите на [github.com](https://github.com)
2. Нажмите **"+"** → **"New repository"**
3. Заполните:
   - **Repository name**: `bottleneck-analyzer` (или любое другое имя)
   - **Description**: "Business Bottleneck Analyzer - Multi-agent system"
   - **Visibility**: Public или Private (на ваше усмотрение)
   - **НЕ** добавляйте README, .gitignore или лицензию (у нас уже есть)
4. Нажмите **"Create repository"**

## Шаг 2: Подключите локальный репозиторий

После создания репозитория GitHub покажет инструкции. Выполните:

```bash
cd /Users/Dima/langchain-project/business-bottleneck-analyzer

# Убедитесь что remote удален (если был неправильный)
git remote remove origin 2>/dev/null || true

# Добавьте правильный remote (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/bottleneck-analyzer.git

# Проверьте что remote правильный
git remote -v

# Отправьте код
git push -u origin main
```

## Если репозиторий уже создан

Если вы уже создали репозиторий, просто обновите remote:

```bash
# Удалите старый remote
git remote remove origin

# Добавьте правильный (замените YOUR_USERNAME и REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Проверьте
git remote -v

# Отправьте код
git push -u origin main
```

## Если нужно создать репозиторий через CLI

```bash
# Установите GitHub CLI (если еще нет)
# brew install gh  # для macOS

# Войдите в GitHub
gh auth login

# Создайте репозиторий и отправьте код
gh repo create bottleneck-analyzer --public --source=. --remote=origin --push
```

## Проверка

После успешного push:

1. Зайдите на ваш GitHub профиль
2. Найдите репозиторий `bottleneck-analyzer`
3. Убедитесь что все файлы загружены

## Дальше

После настройки Git репозитория, следуйте инструкциям в `HOW_TO_DEPLOY.md` для деплоя на Vercel.

