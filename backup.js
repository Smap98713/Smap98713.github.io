(function() {
  'use strict';

  function accountSync() {
    function account(url) {
      url = url + '';
      if (url.toLowerCase().indexOf('account_email=') === -1) { 
        var email = (Lampa.Storage.get('account_email') || Lampa.Storage.get('lampac_unic_id', '')).toLowerCase(); 
        if (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));
      }
      if (url.toLowerCase().indexOf('token=') === -1) { 
        var token = '{token}';
        if (token != '') url = Lampa.Utils.addUrlComponent(url, 'token={token}');
      }
      return url;
    }

function goExport() {
  var favoriteData = {};

  // Извлекаем только нужные ключи: 'favorite' 
  var keysToExport = ['favorite'];
  keysToExport.forEach(function(key) {
    var value = localStorage.getItem(key);
    if (value) {
      favoriteData[key] = value;
    }
  });

  var file;
  try {
    file = new File([JSON.stringify(favoriteData)], "backup.json", {
      type: "text/plain",
    });
  } catch (e) {}

  if (!file) {
    try {
      file = new Blob([JSON.stringify(favoriteData)], {
        type: 'text/plain'
      });
      file.lastModifiedDate = new Date();
    } catch (e) {
      Lampa.Noty.show(Lampa.Lang.translate('account_export_fail'));
    }
  }

  if (file) {
    var formData = new FormData($('<form></form>')[0]);
    formData.append("file", file, "backup.json");

    $.ajax({
      url: account('{localhost}/backup/export'),
      type: 'POST',
      data: formData,
      async: true,
      cache: false,
      contentType: false,
      enctype: 'multipart/form-data',
      processData: false,
      headers: {
        token: account.token
      },
      success: function(j) {
        if (j.secuses) {
          //Lampa.Noty.show(Lampa.Lang.translate('account_export_secuses'));
        } else {
          Lampa.Noty.show(Lampa.Lang.translate('account_export_fail'));
        }
      },
      error: function(e) {
        Lampa.Noty.show(Lampa.Lang.translate('account_export_fail_' + (e.responseJSON.code || 500)));
      }
    });
  }
}

function goImport() {
  var network = new Lampa.Reguest();
  network.silent(account('{localhost}/backup/import'), (data) => {
    if (data.data) {
      var keys = Lampa.Arrays.getKeys(data.data);
      for (var i in data.data) {
        if (data.data[i] !== null && data.data[i] !== undefined) { // Проверка на отсутствие данных, не уверен надо ли
          localStorage.setItem(i, data.data[i]);
        }
      }

      Lampa.Noty.show(Lampa.Lang.translate('account_import_secuses') + ' - ' + Lampa.Lang.translate('account_imported') + ' (' + keys.length + ')');

      // Добавим параметр ?imported=true к URL, для одноразового ребута, иначе не появляются закладки/история.
      setTimeout(function() {
        window.location.href = window.location.origin + window.location.pathname + '?imported=true';
      }, 800);
    } else {
      Lampa.Noty.show(Lampa.Lang.translate('nodata'));
    }
  }, () => {
    Lampa.Noty.show(Lampa.Lang.translate('account_import_fail'));
  }, false, {
    headers: {
      token: account.token
    }
  });
}
    // Слушаем события добавления и удаления из избранного
    Lampa.Favorite.listener.follow('add,added', function(e) {
      setTimeout(function() {
        goExport();
      }, 8000); // 8 секунды задержка иначе сохраняет не всегда
    });

    Lampa.Favorite.listener.follow('remove', function(e) {
      setTimeout(function() {
        goExport();
      }, 8000); // 8 секунды задержка
    });

    // Запуск goImport при синхронизации аккаунта
    if (window.location.search.indexOf('imported=true') !== -1) {
      // Очистим параметр из URL после загрузки
      history.replaceState(null, '', window.location.pathname);
    } else {
      goImport();
    }
  }

  // Проверяем, если account_email или lampac_unic_id равны govnotoken1 или почта@gmail.com, то запускаем( необходимо для тестов
  
  var accountEmail = (Lampa.Storage.get('account_email') || '').toLowerCase(); // Приводим к нижнему регистру
  var lampacUnicId = (Lampa.Storage.get('lampac_unic_id', '') || '').toLowerCase(); // Приводим к нижнему регистру

  if (accountEmail === 'govnotoken1' || accountEmail === 'mamkin.haker@gmail.com' || lampacUnicId === 'govnotoken1' || lampacUnicId === 'mamkin.haker@gmail.com') {
    // Если условие выполняется, вызываем accountSync
    accountSync();
    //Lampa.Noty.show('запуск синхронизации');
  }

})();