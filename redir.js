(function () {
    'use strict';

    Lampa.Platform.tv();

    var server_protocol = location.protocol === "https:" ? 'https://' : 'http://';
    var ping_interval = 5 * 60 * 1000; // 5 минут в миллисекундах
    var currentServer = Lampa.Storage.get('current_server') || '';
    var redirectServer = Lampa.Storage.get('redirect_server') || '';

    var icon_server_redirect = '<svg width="256px" height="256px" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">...</svg>';

    function startMe() {
        $('#REDIRECT').remove();
        $('#FORCE_REDIRECT').remove();

        var domainSVG = icon_server_redirect;
        var domainBUTT = '<div id="REDIRECT" class="head__action selector redirect-screen">' + domainSVG + '</div>';
        var forceRedirectButton = '<div id="FORCE_REDIRECT" class="head__action selector redirect-force">' + domainSVG + '</div>';

        $('#app > div.head > div > div.head__actions').append(domainBUTT);
        $('#app > div.head > div > div.head__actions').append(forceRedirectButton);
        $('#REDIRECT').insertAfter('div[class="head__action selector open--settings"]');
        $('#FORCE_REDIRECT').insertAfter('#REDIRECT');

        if (!Lampa.Storage.get('current_server') || !Lampa.Storage.get('redirect_server')) {
            setTimeout(function () {
                $('#REDIRECT').remove();
                $('#FORCE_REDIRECT').remove();
            }, 10);
        }

        $('#REDIRECT').on('hover:enter hover:click hover:touch', function () {
            window.location.href = server_protocol + redirectServer;
        });

        $('#FORCE_REDIRECT').on('hover:enter hover:click hover:touch', function () {
            console.warn("Выполнен безусловный редирект...");
            window.location.href = server_protocol + redirectServer;
        });

        Lampa.SettingsApi.addComponent({
            component: 'location_redirect',
            name: 'Смена сервера',
            icon: icon_server_redirect
        });

        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: {
                name: 'current_server',
                type: 'input',
                values: '',
                placeholder: 'Текущий сервер: например, server1.online',
                default: ''
            },
            field: {
                name: 'Адрес текущего сервера',
                description: 'Введите адрес текущего сервера'
            },
            onChange: function (value) {
                currentServer = value;
                startMe();
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: {
                name: 'redirect_server',
                type: 'input',
                values: '',
                placeholder: 'Сервер редиректа: например, backup.online',
                default: ''
            },
            field: {
                name: 'Адрес сервера для редиректа',
                description: 'Введите адрес сервера, на который будет выполнен редирект при недоступности текущего сервера'
            },
            onChange: function (value) {
                redirectServer = value;
                startMe();
            }
        });

        // Добавляем новый пункт меню для включения редиректа
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: {
                name: 'enable_redirect',
                type: 'button',
                values: 'Включить редирект',
                default: ''
            },
            field: {
                name: 'Включить редирект',
                description: 'При нажатии будет выполнен редирект на сервер для редиректа.'
            },
            onChange: function () {
                if (redirectServer) {
                    console.warn("Выполнен редирект...");
                    window.location.href = server_protocol + redirectServer;
                }
            }
        });

        setInterval(function () {
            if (currentServer && redirectServer) {
                pingServer(server_protocol + currentServer, function (isOnline) {
                    if (!isOnline) {
                        console.warn("Сервер недоступен. Выполняется автоматический редирект...");
                        window.location.href = server_protocol + redirectServer;
                    }
                });
            }
        }, ping_interval);
    }

    function pingServer(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.timeout = 3000;

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 400) {
                callback(true);
            } else {
                callback(false);
            }
        };

        xhr.onerror = xhr.ontimeout = function () {
            callback(false);
        };

        xhr.open("GET", url + '/ping?' + Date.now(), true);
        xhr.send();
    }

    if (window.appready) startMe();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') {
                startMe();
            }
        });
    }
})();
