# Swan

Swan is small node app, which give some features:

1. Launch WB-GSM module
2. Launch ifup usb0
3. Reset route settings in first time
4. Track internet connection through ping external services like `ya.ru`, and dns services
5. Switch metric between eth0 and usb0

## Configure the launch of `Swan` after restarting the system

It is necessary to add a line with the cron setting to the end of the `/etc/crontab` file:

```bash
@reboot root DEBUG=* /root/node/bin/node /root/hyperion/swan/build/run.js
```

As a result, the file will look like:

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
