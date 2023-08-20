# Swan

Небольшое приложение которое запускается как фоновый процесс и реализует несколько функций:

1. Запуск модуля WB-GSM
2. Запуск ifup usb0
3. Сбрасывает настройки роутера при первом запуске
4. Отслеживает интернет соединение через ping внешнего сервиса `ya.ru`, и dns сервисов
5. Переключает параметр metric между eth0 и usb0, что приводит к перенаправлению трафика из eth0 в usb0 (sim-card), и обратно, при появлении интернета на eth0.

## Установка NodeJS

Необходимо обновить переменную окружения `PATH`, только для наших терминальных сессий.

Для этого необходимо в конец файла `.bashrc` добавить:

```bash
export PATH=/root/bin:$PATH
```

Далее нужно перейти в домашнюю директорию и создать директорию `bin`:

```bash
mkdir bin
```

После чего нужно создать ключевые символические ссылки:

```bash
cd bin

ln -s /root/node/bin/node node
ln -s /root/node/bin/npm npm
ln -s /root/node/bin/npx npx
ln -s /root/node/bin/pino-pretty pino-pretty
```

Для активации изменений в `.bashrc`, закрываем текущую терминальную сессию и открываем новую.

Перед тем как скачивать сбору ноды, необходимо узнать архитекруту процессора используя команду:

```bash
lscpu
```

```text
Architecture:          armv7l
Byte Order:            Little Endian
CPU(s):                1
On-line CPU(s) list:   0
Thread(s) per core:    1
Core(s) per socket:    1
Socket(s):             1
Model:                 5
Model name:            ARMv7 Processor rev 5 (v7l)
CPU max MHz:           792.0000
CPU min MHz:           198.0000
BogoMIPS:              64.00
Flags:                 half thumb fastmult vfp edsp neon vfpv3 tls vfpv4 idiva idivt vfpd32 lpae
```

После чего скачиваем сборку с nodejs, `прям сейчас 18 версия не работает`.

```bash
wget https://nodejs.org/download/release/latest-v16.x/node-v16.20.2-linux-armv7l.tar.xz

tar -xvf node-v16.20.2-linux-armv7l.tar.xz

mv node-v16.20.2-linux-armv7l node

rm -rf node-v16.20.2-linux-armv7l.tar.xz
```

После чего можем проверить версию `node`:

```bash
node -v
```

Установка nodejs завершена, далее нужно глобавльно установить пакет `pino-pretty`:

```bash
npm i -g pino-pretty
```

Установка всех необходимых компонентов выполнена.

## Настройка запуска `Swan` на стороне Wirenboard

Запуск осуществляется через cron, для его настройки необходимо добавить настройку в файл `/etc/crontab`.

Вот так выглядит настройка:

```bash
@reboot root DEBUG=* /root/node/bin/node /root/hyperion/packages/swan/build/run.js
```

В результате, файл должен выглядеть примерно так:

```bash
# /etc/crontab: system-wide crontab
# Unlike any other crontab you don't have to run the `crontab'
# command to install the new version when you edit this file
# and files in /etc/cron.d. These files also have username fields,
# that none of the other crontabs do.

SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# m h dom mon dow user  command
17 *    * * *   root    cd / && run-parts --report /etc/cron.hourly
25 6    * * *   root    test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily )
47 6    * * 7   root    test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.weekly )
52 6    1 * *   root    test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.monthly )
#
@reboot root DEBUG=* /root/node/bin/node /root/hyperion/packages/swan/build/run.js
```

## Сборка проекта

После того как мы добавили настройку в cron, необходимо:

### Клонировать проект в домашнюю директорию

```bash
cd

git clone git@github.com:mitya-borodin/hyperion.git
```

### Перейти в `Swan` и установить зависимости, собрать проект

```bash
cd hyperion/packages/swan

npm i

npm run build
```

### Создать `symlink` ссылку для доступа к файлу логов

```bash
ln -s ~/hyperion/packages/swan/log.txt swan.log
```
