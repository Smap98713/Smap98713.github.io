(function() {
  'use strict';

  function account(url) {
    url = url + '';
    if (url.indexOf('account_email=') == -1) {
      var email = Lampa.Storage.get('account_email');
      if (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));
    }
    if (url.indexOf('uid=') == -1) {
      var uid = Lampa.Storage.get('lampac_unic_id', '');
      if (uid) url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(uid));
    }
    if (url.indexOf('token=') == -1) {
      var token = '{token}';
      if (token != '') url = Lampa.Utils.addUrlComponent(url, 'token={token}');
    }
    return url;
  }

  var disabledimport = false;

  var fields = [
    'file_view',
    'online_view',
    'online_last_balanser',
    'online_watched_last',
    'torrents_view',
    'torrents_filter_data'
  ];

  function goExport(path) {
    var value = {};

    if (path == 'sync') {
      fields.forEach(function(field) {
        value[field] = localStorage.getItem(field) || '';
      });
    } else {
      value['favorite'] = localStorage.getItem('favorite') || '';
    }

    $.ajax({
      url: account('{localhost}/storage/set?path=' + path),
      type: 'POST',
      data: JSON.stringify(value),
      async: true,
      cache: false,
      contentType: false,
      processData: false,
      success: function(j) {
        if (j.success && j.fileInfo)
          localStorage.setItem('lampac_' + path, j.fileInfo.changeTime);
      },
      error: function() {
        console.log('Lampac Storage', 'export', 'error');
      }
    });
  }

  function goImport(path) {
    if (disabledimport == false) {
      var network = new Lampa.Reguest();
      network.silent(account('{localhost}/storage/get?path=' + path + '&responseInfo=true'), function(h) {
        if (h.success && h.fileInfo) {
          if (h.fileInfo.changeTime != Lampa.Storage.get('lampac_' + path, '0')) {
            network.silent(account('{localhost}/storage/get?path=' + path), function(j) {
              if (j.success && j.data) {
                var data = JSON.parse(j.data);
                for (var i in data) {
                  Lampa.Storage.set(i, data[i], true);
                }
                localStorage.setItem('lampac_' + path, j.fileInfo.changeTime);
              }
            });
          }
        } else if (h.msg && h.msg == 'outFile') {
          disabledimport = true;
          goExport(path);
          disabledimport = false;
        }
      });
    }
  }

  Lampa.Storage.listener.follow('change', function(e) {
    if (e.name == 'favorite' || e.name.indexOf('file_view') >= 0) {
      disabledimport = true;
      goExport(e.name == 'favorite' ? 'sync_favorite' : 'sync');
      disabledimport = false;
    }
  });

  setInterval(function() {
    goImport('sync_favorite');
  }, 2000);
  
  setInterval(function() {
    goImport('sync');
  }, 5000);

})();