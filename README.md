# Hyperion

Hyperion is control system for components of a smart home built on [Wirenboard equipment](https://wirenboard.com/ru/product/wiren-board-7).

## Technology

- [Typescript](https://www.typescriptlang.org)
- [Typescript CLI](https://www.typescriptlang.org/docs/handbook/compiler-options.html#using-the-cli)

### Frontend

- [SolidJS](https://www.solidjs.com)
- [Tailwind](https://tailwindcss.com)
- [Mobx](https://mobx.js.org/README.html)
- [ViteJS](https://vitejs.dev)

### Backend

- [NodeJS](https://nodejs.org/en/)
- [Fastify](https://www.fastify.io)
- [Pino](https://github.com/pinojs/pino)
- [Pino-pretty](https://github.com/pinojs/pino-pretty)
- [Mobx](https://mobx.js.org/README.html)
- [Nodemon](https://nodemon.io)
- [RethinkDB](https://rethinkdb.com)
- [MQTT](https://www.npmjs.com/package/mqtt)
- [Mosquitto](https://mosquitto.org)
- [Docker compose for development](https://docs.docker.com/language/nodejs/develop/)
- [Compose-file](https://docs.docker.com/compose/compose-file/)
- [Run in production](https://docs.docker.com/get-started/orchestration/)

### Wirenboard

- [WB 7](https://wirenboard.com/ru/product/wiren-board-7)
- [WB MQTT](https://wirenboard.com/wiki/index.php/MQTT)
- [WB MQTT Convention](https://github.com/wirenboard/conventions/blob/main/README.md)
- [WB WEB GUI IN ETH0](http://192.168.1.75)
- [WB WEB GUI IN WLAN0](http://192.168.2.75)
- [WB MQTT Channels in ETH0](http://192.168.1.75/#!/MQTTChannels)
- [WB MQTT Channels in WLAN0](http://192.168.2.75/#!/MQTTChannels)
- [Mosquitto](https://mosquitto.org)
- [MQTT](https://www.npmjs.com/package/mqtt)

## Environment

- Required `Node@18.12.1` `npm@8.19.2`
- Required `Yarn 1.22.19`
- Required `Docker version 20.10.21, build baeda1f`

## IDE

Рекомендуется использовать `VSCode`, так как в проекте в директории `.vscode`, находятся все конфигурации
и набор расширений которые сделают разработку максимально эффективной и удобной.

Необходимо установить все рекомендованные расширения.

## Установка

### Установка node в ручном режиме

Самый простой вариант начать, это установить `Node@18.12.1` `npm@8.19.2` [отсюда](https://nodejs.org/download/release/v18.12.1/).

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
  Found '~/programming/collaborative-data/.nvmrc' with version <v18.12.1>
  Now using node v18.12.1 (npm v8.19.2)
  ```

- В случае если нужная версия `node` не установлено вы увидите предложение установить её.

## Режим разработки

### Первоначальные действия

#### Установить yarn глобально

```bash
npm i -g yarn
```

#### Установить общие инструменты проекта

```bash
yarn
```

#### Установить зависимости в каждом проекте

```bash
cd backend

yarn

cp .env.example .env

cd ../frontend

yarn

cp .env.example .env
```

#### Запуск БД

Для запуска БД в контейнере, и теперь она всегда будет включаться автоматически, даже после перезагрузки ПК:

```bash
docker-compose up -d
```

### Регулярные действия

```bash
cd backend

yarn start

// Открываем новую консоль и ием во frontend

cd frontend

yarn start
```

Все далее можно работать :-)

### Отладка через VSCode

Необходимо создать фай `./vscode/launch.json` с содержимым указанным ниже:

```json
{
  "version": "1.0.0",
  "configurations": [
    {
      "name": "Rayner",
      "request": "attach",
      "address": "127.0.0.1",
      "port": 9229,
      "localRoot": "${cwd}/packages/rayner/src",
      "skipFiles": ["<node_internals>/**"],
      "type": "node"
    },
    {
      "name": "Kerrigan",
      "request": "attach",
      "address": "127.0.0.1",
      "port": 9230,
      "localRoot": "${cwd}/packages/kerrigan/src",
      "skipFiles": ["<node_internals>/**"],
      "type": "node"
    }
  ]
}
```

Для отладки nodejs приложения запущенного на хостовой машине необходимо использовать конфигурацию `Nodemon`, и выбрать процесс запущенный в этом `src/index.ts` файле.

Для отладки приложения запущенного через docker compose необходимо будет указать адрес инспектора.

В обоих случаях подключение происходит, через HTTP API.

## CI/CD

Ранер будут находиться на локальном компе или в Digitalocean

### CI

Будет выполнено как Docker in docker, запуск команд будет происходить в процессе билда образа, а тесты запущены при помощи docker compose.
Собранные образы будут залиты в хранилище на github.

### CD

Будет выполнена настройка в Github workflow, который будет менять имена образов в docker swarm
