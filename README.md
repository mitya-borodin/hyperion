# Hyperion

Automation of all engineering systems of a private house based on low-level software and hardware from Wirenboard.

## Environment

- Required `Node@18.16.0` `npm@9.5.1`
- Required `Yarn 1.22.19`
- Required `Docker version 20.10.21, build baeda1f`

## IDE

Рекомендуется использовать `VSCode`, так как в проекте в директории `.vscode`, находятся все конфигурации
и набор расширений которые сделают разработку максимально эффективной и удобной.

Необходимо установить все рекомендованные расширения.

## Установка

### Установка node в ручном режиме

Самый простой вариант начать, это установить `Node@18.16.0` `npm@9.5.1` [отсюда](https://nodejs.org/download/release/v18.16.0/).

### Настройка NVM и установка node в автоматизированном режиме

Это рекомендованный вариант контроля версии `node`.

- Устанавливаем [nvm](https://github.com/nvm-sh/nvm), если его нет.
- Далее через [nvm](https://github.com/nvm-sh/nvm) устанавливаем нужную версию node, если у вас оболочка `ZSH`, то можно автоматизировать процесс.

Если у вас оболочка `zsh`, можно установить плагин [zsh-nvm](https://github.com/lukechilds/zsh-nvm), выполнив шаги ниже:

- Выполнить эту команду `git clone https://github.com/lukechilds/zsh-nvm ~/.oh-my-zsh/custom/plugins/zsh-nvm`, она склонирует код плагина для `zsh` в нужную директорию
- Добавить `zsh-nvm` к списку плагинов `plugins=(git bundler ... zsh-nvm)`
- Добавить вот такой кусок текста в `.zshrc`:

  ```text
  # NVM
  autoload -U add-zsh-hook

  load-nvmrc() {

    if [[ -f .nvmrc && -r .nvmrc ]]; then

      nvm use

    elif [[ $(nvm version) != $(nvm version default)  ]]; then

      echo "Reverting to nvm default version"

      nvm use default

    fi

  }

  add-zsh-hook chpwd load-nvmrc
  load-nvmrc
  ```

- Выполнить `source .zshrc`
- Перейти в директорию с файлом `.nvmrc`
- Увидеть что-то подобное, только будет указана версия взятая из вашего `.nvmrc`.

  ```text
  Found '~/programming/collaborative-data/.nvmrc' with version <v18.16.0>
  Now using node v18.16.0 (npm v9.5.1)
  ```

- В случае если нужная версия `node` не установлено вы увидите предложение установить её.

## Режим разработки

### Первоначальные действия

#### Установить yarn глобально

```bash
npm i -g yarn
```

#### Установить зависимости и определите переменные окружения

```bash
yarn

cp .env.example .env
```

#### Запуск БД

Для запуска БД в контейнере, и теперь она всегда будет включаться автоматически, даже после перезагрузки ПК:

```bash
docker compose up -d
```

Накатим миграции:

```bash
yarn prisma:migrate:dev
```

Накатим сидинг:

Перед тем как катить сидинг, стоит изменить часть переменных на свои значения:

```text
## Master User
#
MASTER_USER_EMAIL=dmitriy@borodin.site
MASTER_USER_PASSWORD='1234'
MASTER_USER_NAME="Dmitriy Borodin"

```

```bash
yarn prisma:seed
```

### Регулярные действия

```bash
yarn start
```

## Технологии

- [Typescript](https://www.typescriptlang.org)
- [Typescript CLI](https://www.typescriptlang.org/docs/handbook/compiler-options.html#using-the-cli)

### Frontend

- [ViteJS](https://vitejs.dev)
- [SolidJS](https://www.solidjs.com)
- [Tailwind](https://tailwindcss.com)

### Backend

- [Domain-driven-hexagon](https://github.com/Sairyss/domain-driven-hexagon)
- [Mosquitto](https://mosquitto.org)
- [MQTT](https://www.npmjs.com/package/mqtt)
- [NodeJS](https://nodejs.org/en/)
- [Nodemon](https://nodemon.io)
- [Debug](https://github.com/debug-js/debug#readme)
- [Fastify](https://fastify.dev)
- [Mercurius](https://mercurius.dev/#/)
- [GraphQL](https://graphql.org)
- [SQLlite](https://www.prisma.io/docs/orm/overview/databases/sqlite)
- [Docker compose](https://docs.docker.com/language/nodejs/develop/)
- [Compose-file](https://docs.docker.com/compose/compose-file/)

### Wirenboard

- [WB 7](https://wirenboard.com/ru/product/wiren-board-7)
- [WB MQTT](https://wirenboard.com/wiki/index.php/MQTT)
- [WB MQTT Convention](https://github.com/wirenboard/conventions/blob/main/README.md)
- [Mosquitto](https://mosquitto.org)
- [MQTT](https://www.npmjs.com/package/mqtt)

## План установки

**Все инсталляции лучше всего проводить как отдельные `docker-compose.yaml`` файлы.**

### Облако

#### Хостинг

Покупаем виртуальную машину на одном из хостингов:

- <https://ihc.ru>
- <https://digitalocean.com>

#### WireGuard Easy VPN

Устанавливаем [WireGuard Easy VPN](https://github.com/wg-easy/wg-easy).

Установка будет осуществляться через `docker-compose.yaml`.

Создадим `~/wg-easy`, перейдем туда и там создадим необходимые каталоги.

```bash
cd
mkdir wg-easy
cd wg-easy
touch docker-compose.yaml
```

Заполняем ключевые поля `WG_HOST, PASSWORD` в настройках, и заполняем файл `~/wg-easy/docker-compose.yaml`, следующим содержимым:

```yaml
version: '3.8'
services:
  wg-easy:
    environment:
      # ⚠️ Required:
      # Change this to your host's public address
      - WG_HOST=CLOUD_HOST

      # Optional:
      - PASSWORD=foobar123
      # - WG_PORT=51820
      # - WG_DEFAULT_ADDRESS=10.8.0.x
      # - WG_DEFAULT_DNS=1.1.1.1
      # - WG_MTU=1420
      # - WG_ALLOWED_IPS=192.168.15.0/24, 10.0.1.0/24
      # - WG_PRE_UP=echo "Pre Up" > /etc/wireguard/pre-up.txt
      # - WG_POST_UP=echo "Post Up" > /etc/wireguard/post-up.txt
      # - WG_PRE_DOWN=echo "Pre Down" > /etc/wireguard/pre-down.txt
      # - WG_POST_DOWN=echo "Post Down" > /etc/wireguard/post-down.txt

    image: weejewel/wg-easy
    container_name: wg-easy
    volumes:
      - .:/etc/wireguard
    ports:
      - '51820:51820/udp'
      - '51821:51821/tcp'
    restart: unless-stopped
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    sysctls:
      - net.ipv4.ip_forward=1
      - net.ipv4.conf.all.src_valid_mark=1
```

Запускаем:

```bash
docker compose up -d
```

Далее в Web GUI создадим туннели.

Переходим на тот хост который указали в поле `WG_HOST`, `http://${CLOUD_HOST}:51820`.

Создаем несколько туннелей:

- Для роутера, чтобы через него получать доступ к WB, или непосредственно для WB, если роутер не поддерживает `WireGuard`.
- Для компьютера
- Для телефона

В случае если роутер поддерживает `WireGuard`, на роутере нужно будет пробросить порты:

- 80 (внутренний) -> 80 (внешний)
- 22 (внутренний) -> 22 (внешний)
- 18883 (внутренний) -> 18883 (внешний)

В случае если мы установили `WireGuard Client` на контроллер то никакие порты пробрасывать не нужно.

#### Mosquitto

Установим MQTT брокер `Mosquitto`.

Установка будет осуществляться через `docker-compose.yaml`.

Создадим `~/mosquitto`, перейдем туда и там создадим необходимые каталоги.

```bash
cd
mkdir mosquitto
cd mosquitto
mkdir ./config
touch ./config/mosquitto.conf
mkdir ./data
mkdir ./log
touch mosquitto.pwd # этот файл будет хранить логи и пароль
touch docker-compose.yaml
```

Заполняем `~/mosquitto/config/mosquitto.conf` следующим содержимым:

```text
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log

#Turn on port listening
listener 1883
#Disable anonomous login:
allow_anonymous false
#Password file:
password_file /etc/mosquitto/mosquitto.pwd
```

Определяем логин и пароль для доступа к брокеру в формате `USER_NAME:PASSWORD` и записываем в файл `~/mosquitto/mosquitto.pwd`, эти данные будут использованы для настройки контроллера.

Заполняем `~/mosquitto/docker-compose.yaml`, следующим содержимым:

```yaml
version: '3.8'
services:
  mosquitto:
    image: eclipse-mosquitto
    restart: always
    privileged: true
    ports:
      - '0.0.0.0:18883:1883/tcp'
      - '0.0.0.0:9001:9001/tcp'
    volumes:
      - './mosquitto/config:/mosquitto/config'
      - './mosquitto/data:/mosquitto/data'
      - './mosquitto/log:/mosquitto/log'
      - './mosquitto/mosquitto.pwd:/etc/mosquitto/mosquitto.pwd'
```

Запускаем

```bash
docker compose up -d
```

Проверить работоспособность можно при помощи программы: <https://mqtt-explorer.com>.

#### Gitea

Устанавливаем `Gitea`, она понадобится для организации резервного копирования.

Установка будет осуществляться через `docker-compose.yaml`.

Создадим `~/gitea`, перейдем туда и там создадим необходимые каталоги:

```bash
cd
mkdir gitea
cd gitea
mkdir ./pg-data
mkdir ./data
touch docker-compose.yaml
```

Заполняем `~/gitea/docker-compose.yaml`, следующим содержимым:

```yaml
version: '3.8'

networks:
  gitea:
    external: false

services:
  server:
    image: gitea/gitea:1.19.0
    container_name: gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=postgres
      - GITEA__database__HOST=gitea_pg_db:5432
      - GITEA__database__NAME=gitea
      - GITEA__database__USER=gitea
      - GITEA__database__PASSWD=gitea
    restart: always
    networks:
      - gitea
    volumes:
      - ./data:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    ports:
      - '3001:3000'
      - '222:22'
    depends_on:
      - db

  db:
    image: postgres:14
    restart: always
    container_name: gitea_pg_db
    environment:
      - POSTGRES_USER=gitea
      - POSTGRES_PASSWORD=gitea
      - POSTGRES_DB=gitea
    networks:
      - gitea
    volumes:
      - ./pg-data:/var/lib/postgresql/data
```

Запускаем

```bash
docker compose up -d
```

Дальнейшая настройка выполняется через Gitea Web GUI.

### Контроллер

#### SSH

Первым делом нужно обеспечить SSH.

См. <https://wirenboard.com/wiki/SSH>

Выполняем вход:

- Либо через VPN сеть если у нас роутер который поддерживает `WireGuard`.
- Либо через встроенный wifi, если вы рядом с контроллером.
- Либо через локальную сеть, если контроллер и ваш ПК подключены к одной сети.

Первый вход будет выполнен по паролю, и пароль по умолчанию это `wirenboard`.

Рекомендуется отказаться от аутентификации по паролю, и перейти на аутентификацию по сертификату.

Для этого:

- Создаем файл `nano ~/.ssh/authorized_keys`
- Кладем в него свой публичный ключ
- Проверяем доступ по сертификату `ssh root@10.8.0.4`, подставив подходящий IP адрес.
- Отключаем вход по паролю добавив строчку `PasswordAuthentication no` в файл `nano /mnt/data/etc/ssh/sshd_config.wb`.
- Перезапускаем сервис `systemctl restart ssh`
- Готово, доступ по паролю отключен.

#### Установка WireGuard на WB

В случае если роутер не поддерживает `WireGuard`, мы установим его клиент на контроллер, и установим соединение с сервером непосредственно, нужно иметь в виду, что это будет тратить ресурсы контроллера.

#### MQTT Bridge

См. <https://wirenboard.com/wiki/MQTT#Создание_своего_брокера_MQTT>

Для того, чтобы контроллер публиковал и принимал сообщения от внешнего брокера, нужно выполнить следующие настройки.

Для настройки поста, нужно отредактировать всего 1 файл: `/mnt/data/etc/mosquitto/conf.d/20bridges.conf` и вставить в него следующее содержимое:

```text
connection bridge20
address ${CLOUD_HOST}:18883
notifications true
notification_topic /clientnotification/bridge_status
remote_username ${USERNAME}
remote_password ${PASSWORD}
topic # both
```

#### ZigBee

См. <https://wirenboard.com/wiki/Zigbee>

В случае если установлен модуль ZigBee необходимо выполнить установку соответствующих пакетов.

Следуем [инструкции WB](https://wirenboard.com/wiki/Zigbee), устанавливаем пакеты в соответствии с оборудованием и выполняем по очередное добавление устройств в систему.

Для улучшения качества сигнала стоит использовать внешнюю антенну на подобие:

```text
Антенна Espada ESP-ANT3B всенаправленная поможет максимально улучшить качество сигнала Wi-Fi.
При этом разместить ее можно как внутри помещения, так и снаружи, на металлической поверхности.
Для надежной фиксации антенны предусмотрено магнитное основание.
Длинный, 3-метровый, кабель предусматривает стабильное подключение антенны к роутеру.
В качестве разъема подключения у антенны Espada ESP-ANT3B используется RP-SMA Male. Особенности конструкции антенны предполагают ее эффективную работу по передаче сигнала.
Коэффициент усиления при этом составляет 3 дб. А диапазон рабочих частот антенны - 2,4 - 2,5 ГГц.
```

#### Settings

См. <https://wirenboard.com/wiki/index.php?title=RS-485:Configuration_via_Web_Interface&mobileaction=toggle_view_desktop>

Настройку всех физически подключенных устройств, и беспроводных устройств, выполняют в WB Web GUI.

Для начала конфигурирования необходимо подключаемся к GUI контроллера внутри VPN, адрес будет похож на `http://10.8.0.4:81`.

После чего выполняем рекомендации описанные в документации [начальное конфигурирование устройств](https://wirenboard.com/wiki/index.php?title=RS-485:Configuration_via_Web_Interface&mobileaction=toggle_view_desktop), разбираемся, что и как делать, и по итогу у нас должны появиться все устройства, подключенные проводами или бкз проводов на странице `Devices/Устройства`.

#### Back up settings

См. <https://wirenboard.com/wiki/Wiren_Board_Firmware_Update#user-files>

Для того, чтобы сделать резервную копию настроек, необходимо скопировать содержимое `/mnt/data/etc`.

Это можно делать разными путями:

- Непосредственно скопировать.
- Инициализировать git репозиторий в `/mnt/data/etc` и при изменении конфигураций публиковать их в `Gitea`.
- Воспользоваться [VestaSync](https://github.com/vvzvlad/vestasync), на свой страх и риск.

В случае переустановки прошики на контроллере, такие пакеты как ZigBee и другие приложения установленные в `/mnt/data/root`, нужно будет переустановить. Их не стоит копировать, так как переустановка это не сложный и быстрый процесс, главное знать список софта которы йнужно установить.

#### Система управления контроллером

Система управления контроллером не будет расположена на борту контроллера, чтобы не занимать его мощности.
Система состоит из трех частей:

1. База данных
2. Сервис который выполнят все необходимые вычисления и отдает команды
3. Фронтенд для пользовательского взаимодействия

- Устанавливаем `Hyperion` на ту же виртуальную машину.
- Прописываем у него в переменных окружения данные для подключения к нашему MQTT брокеру.
- Входим в web интерфейс `Hyperion` (адрес будет похож на `http://CLOUD_HOST`), и смотрим вкладку `Устройства`, там должны появиться все устройства которые имеются в `Wirenboard Web GUI`.
- Размечаем устройства в соответствии с проектом.
- Инициализируем макросы в соответствии с проектом.
- Проверяем работоспособность все случаев в соответствии с проектом.
- Сдаем работу заказчику, демонстрируя все случаи в соответствии с проектом.
- Вся дальнейшая работа происходит в полностью автоматическом режиме, если не предусмотрено ручное управление чем либо.
