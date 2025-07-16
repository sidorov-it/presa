# CloudPayments Setup Guide

## Обзор

Этот проект использует CloudPayments для обработки платежей за токены. CloudPayments предоставляет виджет для приема платежей и webhooks для уведомлений о статусе платежей.

## Настройка

### 1. Получение ключей CloudPayments

1. Зарегистрируйтесь на [CloudPayments](https://cloudpayments.ru/)
2. Получите `Public ID` и `Secret Key` в личном кабинете
3. Добавьте ключи в файл `.secrets`:

```env
CLOUDPAYMENTS_PUBLIC_ID=pk_your_public_id_here
CLOUDPAYMENTS_SECRET_KEY=your_secret_key_here
```

### 2. Настройка webhooks

В личном кабинете CloudPayments настройте webhook URL:
- URL: `https://yourdomain.com/api/webhooks/cloudpayments`
- Метод: POST
- События: Pay, Fail, Refund

### 3. Тестирование

Для тестирования используйте тестовые ключи:
- Public ID: `test_api_00000000000000000000001`
- Secret Key: `test_secret_key`

## Архитектура

### Клиентская часть
- `useCloudPaymentsPayment` - хук для работы с CloudPayments
- `CloudPaymentsPaymentButton` - компонент кнопки оплаты
- Виджет CloudPayments загружается через CDN

### Серверная часть
- `/api/tokens/purchase/cloudpayments` - создание покупки
- `/api/webhooks/cloudpayments` - обработка webhooks
- `/api/tokens/purchase/status/[purchaseId]` - проверка статуса

## Процесс оплаты

1. Пользователь нажимает кнопку "Купить"
2. Создается запись о покупке в БД со статусом `pending`
3. Открывается виджет CloudPayments
4. Пользователь вводит данные карты и подтверждает платеж
5. CloudPayments отправляет webhook о результате платежа
6. Сервер обновляет статус покупки и начисляет токены

## Статусы платежей

- `pending` - платеж создан, ожидает оплаты
- `completed` - платеж успешно завершен
- `failed` - платеж не удался
- `canceled` - платеж отменен

## Безопасность

- Все чувствительные операции выполняются на сервере
- Webhook подписи валидируются (опционально)
- Public ID может быть доступен на клиенте
- Secret Key должен храниться только на сервере

## Отладка

1. Проверьте, что скрипт CloudPayments загружен
2. Убедитесь, что переменные окружения установлены
3. Проверьте логи webhook'ов в CloudPayments
4. Используйте консоль браузера для отладки клиентской части 