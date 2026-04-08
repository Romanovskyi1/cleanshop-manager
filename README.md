# CleanShop Manager Panel

React-дашборд для менеджеров и администраторов.
Работает на том же API что и TMA клиента.

## Быстрый старт

```bash
npm install
npm run dev
# http://localhost:5174
```

## Переменные окружения

```bash
# .env.local
VITE_API_URL=http://localhost:3000   # адрес NestJS API
```

## Роуты и доступ

| Путь | Доступ | Страница |
|------|--------|---------|
| `/login` | Публичный | Вход через Telegram или Dev-ID |
| `/manager` | manager + admin | Дашборд |
| `/manager/orders` | manager + admin | Заказы + подтверждение дат |
| `/manager/invoices` | manager + admin | Инвойсы + загрузка PDF |
| `/manager/chat` | manager + admin | Чат с клиентами |
| `/manager/clients` | manager + admin | Компании и пользователи |
| `/manager/catalog` | **admin only** | Управление каталогом |

## Dev-вход (без Telegram)

В режиме `npm run dev` на странице `/login` появляется поле
для входа по Telegram ID:

- `987654321` — менеджер Anna
- `123456789` — клиент Klaus (будет отклонён — клиентам доступ закрыт)

## Структура файлов

```
src/
├── App.tsx                     ← роутер + защита
├── main.tsx
├── index.css
├── api/
│   ├── client.ts               ← fetch + auth + refresh
│   └── index.ts                ← typed API методы
├── store/
│   └── auth.ts                 ← Zustand: user, login, logout
├── components/
│   ├── ProtectedRoute.tsx      ← guard: manager | admin
│   ├── layout/
│   │   ├── Layout.tsx          ← sidebar + header + outlet
│   │   └── Layout.module.css
│   └── ui/
│       └── index.tsx           ← StatCard, Table, Badge, Btn, Modal...
└── pages/
    ├── LoginPage.tsx
    ├── dashboard/DashboardPage.tsx
    ├── orders/OrdersPage.tsx
    ├── invoices/InvoicesPage.tsx   ← загрузка PDF + авторассылка
    ├── chat/ChatPage.tsx           ← ответы клиентам
    ├── clients/ClientsPage.tsx     ← смена ролей (admin)
    └── catalog/CatalogPage.tsx     ← полный CRUD (admin only)
```

## Как работает защита роутов

```
Запрос на /manager/*
  ↓
ProtectedRoute
  ├── user не залогинен  → /login
  ├── user.role = client → /login (клиентам нельзя)
  └── user.role = manager|admin → рендерим страницу

Запрос на /manager/catalog
  ↓
ProtectedRoute requireAdmin
  ├── user.role = manager → /manager (недостаточно прав)
  └── user.role = admin   → рендерим CatalogPage
```

## Отличия кабинетов внутри одного интерфейса

**Менеджер** видит в sidebar: Дашборд, Заказы, Инвойсы, Чат, Клиенты.
Каталог в sidebar **не отображается**.

**Администратор** видит всё то же + Каталог в sidebar.
На странице Клиенты видит кнопку смены роли пользователей.
На странице Каталог видит кнопки «Добавить», «Редактировать», «Скрыть».
