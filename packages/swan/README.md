# Swan

Небольшое приложение которое запускается как фоновый процесс и реализует несколько функций:

1. Запуск модуля WB-GSM
2. Запуск ifup usb0
3. Сбрасывает настройки роутера при первом запуске
4. Отслеживает интернет соединение через ping внешнего сервиса `ya.ru`, и dns сервисов
5. Переключает параметр metric между eth0 и usb0, что приводит к перенаправлению трафика из eth0 в usb0 (sim-card), и обратно, при появлении интернета на eth0.

## Настройка запуска `Swan` на стороне Wirenboard

Запуск осуществляется через cron, для его настройки необходимо добавить настройку в файл `/etc/crontab`.

Вот так выглядит настройка:

```bash
@reboot root DEBUG=* /root/node/bin/node /root/hyperion/swan/build/run.js
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
@reboot root DEBUG=* /root/node/bin/node /root/hyperion/swan/build/run.js
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
