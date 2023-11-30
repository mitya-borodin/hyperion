# Фильтр

Фильтрация это общий элемент между `устройствами` и `макросами`.

Фильтрация позволяет отфильтровать по:

- Строке, будем искать в объекте [HyperionDevice](../src/domain/hyperion-device.ts) либо в [Macros](../src/domain/macroses/macros.ts).
  - В [HyperionDevice](../src/domain/hyperion-device.ts) мы будем смотреть в поля:
    - `id`
    - `title.en`
    - `title.ru`
    - `markup.title.ru`
    - `markup.title.en`
    - `markup.description`
    - `controls.id`
    - `controls.title.ru`
    - `controls.title.en`
    - `controls.units`
    - `controls.markup.title.ru`
    - `controls.markup.title.en`
    - `controls.markup.description`
  - В [Macros](../src/domain/macroses/macros.ts) мы будем смотреть в поля:
    - `id`
    - `name`
    - `description`
- Драйверу [HyperionDevice](../src/domain/hyperion-device.ts) поле `driver`.
- Типу контрола [HyperionDeviceControl](../src/domain/hyperion-control.ts) поле `type`.
- Единице измерения контрола [HyperionDeviceControl](../src/domain/hyperion-control.ts) поле `units`.
- Наличию ошибки либо в [HyperionDevice](../src/domain/hyperion-device.ts) либо в [HyperionDeviceControl](../src/domain/hyperion-control.ts) поле `units`.
- Цвету либо [HyperionDevice](../src/domain/hyperion-device.ts) либо в [HyperionDeviceControl](../src/domain/hyperion-control.ts) поле `markup.color`.
- Лейблу поле `labels`, как для [HyperionDevice](../src/domain/hyperion-device.ts), так и для [Macros](../src/domain/macroses/macros.ts).

Должна быть реализована для форматов:

- Мобильный, не рассматриваем горизонтальный, просто ничего не должно сломаться, должно работать по вертикальным правилам.
- Планшетный, вертикальный и горизонтальный.
- Ноутбук.
- Настольный.
- Телевизор.

Данные для фильтрации генерируются на стороне BE, FE просто их скачивает через `GraphQL Subscription` при подписке, а в дальнейшем получает их в реальном времени.
