(function () {
    'use strict';

    Lampa.Platform.tv();

    var server_protocol = location.protocol === "https:" ? 'https://' : 'http://';
    var ping_interval = 5 * 60 * 1000; // 5 минут в миллисекундах
    var currentServer = Lampa.Storage.get('location_server') || '';

    var icon_server_redirect = '<svg width="256px" height="256px" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">...</svg>';

    function startMe() {
        $('#REDIRECT').remove();

        var domainSVG = icon_server_redirect;
        var domainBUTT = '<div id="REDIRECT" class="head__action selector redirect-screen">' + domainSVG + '</div>';

        $('#app > div.head > div > div.head__actions').append(domainBUTT);
        $('#REDIRECT').insertAfter('div[class="head__action selector open--settings"]');

        if (!Lampa.Storage.get('location_server')) {
            setTimeout(function () {
                $('#REDIRECT').remove();
            }, 10);
        }

        $('#REDIRECT').on('hover:enter hover:click hover:touch', function () {
            window.location.href = server_protocol + Lampa.Storage.get('location_server');
        });

        Lampa.SettingsApi.addComponent({
            component: 'location_redirect',
            name: 'Смена сервера',
            icon: icon_server_redirect
        });

        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: {
                name: 'location_server',
                type: 'input',
                values: '',
                placeholder: 'Например: bylampa.online',
                default: ''
            },
            field: {
                name: 'Адрес сервера',
                description: 'Нажмите для ввода, смену сервера можно будет сделать кнопкой в верхнем баре'
            },
            onChange: function (value) {
                if (value === '') {
                    $('#REDIRECT').remove();
                } else {
                    currentServer = value;
                    startMe();
                }
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: {
                name: 'const_redirect',
                type: 'trigger',
                default: false
            },
            field: {
                name: 'Постоянный редирект',
                description: 'Чтобы отключить постоянный редирект зажмите клавишу ВНИЗ при загрузке приложения'
            }
        });

        Lampa.Keypad.listener.follow("keydown", function (e) {
            if (e.code === 40 || e.code === 29461) {
                Lampa.Storage.set('const_redirect', false);
            }
        });

        setTimeout(function () {
            if (Lampa.Storage.field('const_redirect') === true) {
                window.location.href = server_protocol + Lampa.Storage.get('location_server');
            }
        }, 300);

        // Пинг сервера
        setInterval(function () {
            if (currentServer) {
                pingServer(server_protocol + currentServer, function (isOnline) {
                    if (!isOnline) {
                        console.log("Сервер недоступен. Выполняется автоматический редирект...");
                        window.location.href = server_protocol + Lampa.Storage.get('location_server');
                    }
                });
            }
        }, ping_interval);
    }

    // Функция для проверки доступности сервера
    function pingServer(url, callback) {
        var img = new Image();
        var timeout = setTimeout(function () {
            img.src = ""; // Прерываем загрузку
            callback(false);
        }, 3000); // Тайм-аут на 3 секунды

        img.onload = function () {
            clearTimeout(timeout);
            callback(true);
        };

        img.onerror = function () {
            clearTimeout(timeout);
            callback(false);
        };

        img.src = url + '/favicon.ico?' + Date.now(); // Используем favicon для быстрой проверки
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