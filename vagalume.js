
// bicha

var vagalume = (function () {
    var splitUrl = function (url) {
        var tmp = url.split('?');
        
        var first = tmp[0] || '';
        var second = tmp.slice(1).join('?') || '';
        
        if (second !== '')
            tmp = second.split('#');
        else
            tmp = first.split('#');
        
        var third = tmp.slice(1).join('#') || '';
       
        return [first, second, third];
    };
    var joinUrl = function (first, second, third) {
        var url = first;
        if (second !== '')
            url += '?' + second;
        if (third !== '')
            url += '#' + third;
        return url;
    };
    var changeQueryStringParam = function (query, key, value) {
        var tempArr = splitUrl(query);
        
        var baseUrl = tempArr[0];
        var paramsUrl = tempArr[1];
        var remainUrl = tempArr[2];
        
        var assign = key + '=' + value;
        
        var keyLength = key.length;
        
        var found = false;
        
        var params = paramsUrl.split('&');
        for (var i = 0; i < params.length && !found; i++) {
            if (params[i].slice(0, keyLength) === key) {
                params.splice(i, 1, '&' + assign);
                paramsUrl = params.join('&');
            }
        }
        
        if (!found) {
            if (paramsUrl === '')
                paramsUrl = '?' + assign;
            else
                paramsUrl += '&' + assign;
        }

        return joinUrl(baseUrl, paramsUrl, remainUrl);
    };
    var doQueryCaptcha = function (query, onCaptcha, onData) {
        function onPreData(data) {
            console.log(data);
            if (data && data.captcha) {
                onCaptcha(data.url, function (input) {
                    query = changeQueryString(query, 'serial', data.serial);
                    query = changeQueryString(query, 'udig', input);
                    onPreData(query, onPreData);
                });
            } else
                onData(data);
        }
        $.getJSON(query, onPreData);
    };
    var _processMusicInfoData = function (data, onEnd) {
        if (!data.type || data.type == 'notfound')
            onEnd({});
        else if (data.type == 'song_notfound') {
            var obj = {
                artist: {
                    url: data.art.url,
                    name: data.art.name,
                },
            }
            
            onEnd(obj);
        } else {
            if (!data.mus[0])
                onEnd({});
            
            var obj = {
                artist: {
                    name: data.art.name,
                },
                music: {
                    name: data.mus[0].name,
                    lyrics: data.mus[0].text,
                    youtubeId: data.mus[0].ytid,
                },
            }
            
            if (data.alb) {
                obj.album = {
                    name: data.alb.name,
                    year: data.alb.year,
                    imageUrl: data.alb.img,
                }
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
