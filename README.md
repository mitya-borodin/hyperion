# Butler

Butler is software which control all electronic system which powered by [wirenboard controller](https://wirenboard.com/ru/product/wiren-board-7/).

## Technology

- [Typescript](https://www.typescriptlang.org)
- [Typescript CLI](https://www.typescriptlang.org/docs/handbook/compiler-options.html#using-the-cli)

### Frontend

- [SolidJS](https://www.solidjs.com)
- [Tailwind](https://tailwindcss.com)
- [Mobx](https://mobx.js.org/README.html)
- [Snowpack](https://www.snowpack.dev/)

### Backend

- [NodeJS](https://nodejs.org/en/)
- [Fastify](https://www.fastify.io)
- [Pino](https://github.com/pinojs/pino)
- [Pino-pretty](https://github.com/pinojs/pino-pretty)
- [Mobx](https://mobx.js.org/README.html)
- [Nodemon](https://nodemon.io)
- [RethinkDB](https://rethinkdb.com)
- [MQTT](https://www.npmjs.com/package/mqtt)
- [Docker only for development in OS which will install on wirenboard](https://www.docker.com/)

## Environment

- Required `Node@14.17.6` `npm@6.14.15` or older
- Required `Yarn 1.22.17` or older
- Required `Docker version 20.10.8, build 3967b7d` or older

## IDE

Рекомендуется использовать `VSCode`, так как в проекте в директории `.vscode`, находятся все конфигурации
и набор расширений которые сделают разработку максимально эффективной и удобной.

Необходимо установить все рекомендованные расширения.

## Установка

### Установка node в ручном режиме

Самый простой вариант начать, это установить `Node@14.18.2` `npm@6.14.15` [отсюда](https://nodejs.org/download/release/v14.18.2/).

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
  Found '~/programming/collaborative-data/.nvmrc' with version <v16.13.1>
  Now using node v16.13.1 (npm v8.1.2)
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
      "type": "node",
      "request": "attach",
      "name": "Nodemon",
      "processId": "${command:PickProcess}",
      "restart": true,
      "protocol": "inspector"
    }
  ]
}
```

Для отладки nodejs приложения запущенного на хостовой машине необходимо использовать конфигурацию `Nodemon`, и выбрать процесс запущенный в этом `src/index.ts` файле.

## CI/CD

### CI

Будет выполнена настройка в Github workflow.

### CD

В данный момент как это делать не понятно.

## Развертывание

В данный момент как это делать не понятно.
