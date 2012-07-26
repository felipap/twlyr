var vagalume = (function () {
    var urlmodule = (function () {
        var forEachKey = (function () {
            console.log('keys');
            console.log(Object.keys);
            if (Object.keys) {
                return function (obj, fn) {
                    if (typeof obj === 'object') {
                        var keys = Object.keys(obj);
                        for (var i = 0; i < keys.length; i++)
                            fn(keys[i], obj[keys[i]]);
                    }
                };
            }
            return function (obj, fn) {
                if (typeof obj === 'object') {
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key))
                            fn(key, obj[key]);
                    }
                }
            };
        }());
        return {
            join: function (obj) {
                var url = obj.url || '';
                var params = obj.params || {};
                var hash = obj.hash || '';
                
                if (typeof url !== 'string' ||
                    typeof hash !== 'string' ||
                    typeof params !== 'object')
                    return '';
                    
                if (params.length !== 0) {
                    var params_url = '';
                    forEachKey(params, function (k, v) {
                        if (params_url.length !== 0)
                            params_url += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(v);
                        else
                            params_url = '?' + encodeURIComponent(k) + '=' + encodeURIComponent(v);
                    });
                    url += params_url;
                }
                if (hash.length !== 0)
                    url += '#' + hash;
                
                return url;
            },
            parse: function (url) {
                var obj = {};
                var params = '';
                
                if (typeof url !== 'string' || url.length === 0)
                    return obj;
                    
                url = url.split('#');
                obj.url = url[0];
                if (url.length > 1)
                    obj.hash = url.slice(1).join('#');
                    
                url = obj.url.split('?');
                obj.url = url[0];
                if (url.length > 1)
                    params = url.slice(1).join('?');
                    
                if (params.length === 0)
                    return obj;
                
                params = params.split('&');
                obj.params = {};
                
                for (var i = 0; i < params.length; i++) {
                    url = params[i].split('=');
                    if (url.length >= 2) {
                        var k = url[0];
                        var v = url.slice(1).join('=');
                        
                        try {
                            k = decodeURIComponent(k);
                        } catch (e) {
                            k = escape(k);
                        }
                        try {
                            v = decodeURIComponent(v);
                        } catch (e) {
                            v = escape(v);
                        }
                        
                        if (!obj.params[k] && k.length !== 0 && v.length !== 0)
                            obj.params[k] = v;
                    }
                }
                
                return obj;
            },
        }
    }());
    var doQueryCaptcha = function (query, onCaptcha, onData) {
        function onPreData(data) {
            if (data && data.captcha) {
                var obj = urlmodule.parse(data.url);
                onCaptcha(data.url, function (input) {
                    obj.serial = data.serial;
                    obj.udig = input;
                    onPreData(urlmodule.join(obj), onPreData);
                });
            } else
                onData(data);
        }
        $.getJSON(query, onPreData);
    };
    var _processMusicInfoData = function (data, onEnd) {
        if (!data || !data.type || data.type === 'notfound' ||
            !data.art || !data.mus || data.mus.length <= 0)
            onEnd({});
        else if (data.type === 'song_notfound') {
            var obj = {
                artist: {
                    url: data.art.url,
                    name: data.art.name,
                },
            }
            
            onEnd(obj);
        } else {
            var obj = {
                match: (data.type === 'exact'),
                artist: {
                    name: data.art.name,
                },
                music: [],
            }
            
            for (var i = 0; i < data.mus.length; i++) {
                var music = {
                    name: data.mus[i].name,
                    lyrics: data.mus[i].text,
                    youtubeId: data.mus[i].ytid,
                };
                if (data.mus[i].alb) {
                    music.album = {
                        name: data.mus[i].alb.name,
                        year: data.mus[i].alb.year,
                        imageUrl: data.mus[i].alb.img,
                    };
                }
                obj.music.push(music);
            }
           
            onEnd(obj);
        }
    };
    return {
        musicListFromArtistUrl: function (artistUrl, onCaptcha, onEnd) {
            function onData (data) {
                if (!data || !data.toplyrics || !data.toplyrics.item)
                    onEnd([]);
                else {
                    var musicList = [];
                    for (var i = 0; i < data.toplyrics.item.length; i++) {
                        musicList.push({
                            id: data.toplyrics.item[i].id,
                            name: data.toplyrics.item[i].desc,
                        });
                    }
                    onEnd(musicList);
                }
            }
            
            if (typeof artistUrl !== 'string' ||
                typeof onEnd !== 'function' ||
                typeof onCaptcha !== 'function')
                return vagalume;
        
            if (artistUrl.charAt(artistUrl.length - 1) != '/')
                artistUrl += '/';
                
            $.getJSON(artistUrl + 'index.js', onData);
            
            return vagalume;
        },
        musicInfoFromName: function (artistName, musicName, onCaptcha, onEnd) {
            if (typeof musicName === 'function' && !onEnd) {
                onEnd = onCaptcha;
                onCaptcha = musicName;
                musicName = '';
            } else if (!musicName)
                musicName = '';
            
            if (!artistName ||
                typeof onCaptcha !== 'function' ||
                typeof onEnd !== 'function')
                return vagalume;
                
            console.log(encodeURIComponent(artistName));
            console.log(encodeURIComponent(musicName));
            
            doQueryCaptcha('http://www.vagalume.com.br/api/search.php?' +
                     'art=' + encodeURIComponent(artistName) +
                    '&mus=' + encodeURIComponent(musicName) +
                    '&extra=alb,ytid,artpic',
                    onCaptcha,
                    function (data) {
                        _processMusicInfoData(data, onEnd);
                    });
                    
            return vagalume;
        },
        musicInfoFromId: function (musicId, onCaptcha, onEnd) {
            if (!musicId ||
                typeof onCaptcha !== 'function' ||
                typeof onEnd !== 'function')
                return vagalume;
                
            doQueryCaptcha('http://www.vagalume.com.br/api/search.php?' +
                     'musid=' + encodeURIComponent(musicId) +
                    '&extra=alb,ytid,artpic',
                    onCaptcha,
                    function (data) {
                        _processMusicInfoData(data, onEnd);
                    });
                    
            return vagalume;
        },
    };
}());
