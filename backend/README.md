# Butler BackEnd

## Authentication

См. [Token-Based Authentication](./docs/Token-Based-Authentication.md)

## Authorization

Права доступа в системе не предусмотрены

## Backlog

- Добавить возможность перемещать Lighting group
  - При перемещении группы, все устройства перемещаются вместе с группой
- Добавить возможность удалять Lighting group
  - При удалении группы, все устройства этой группы попадают на склад
- Добавить возможность выполнять CRUD для PlaceOfInstallation
- Добавить возможность выполнять CRUD для LightingGroupLocation
- Добавить модель WirenboardDevices
  - Включает в себя название, MQTT топик, текущее состояние
- Добавить двойное связывание данных между объектами приложения и WirenboardDevices
  - Сделать автоматическое влияние на WirenboardDevices через прослушивание приложения
  - Сделать автоматическое влияние на приложение через прослушивание WirenboardDevices
