var vagalume = (function() {

    var urlmodule = (function() {
        var forEachKey = (function() {
            if (Object.keys) {
                return function(obj, fn) {
                    if (typeof obj === 'object') {
                        var keys = Object.keys(obj);
                        for (var i = 0; i < keys.length; i++)
                            fn(keys[i], obj[keys[i]]);
                    }
                };
            }
            return function(obj, fn) {
                if (typeof obj === 'object') {
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key))
                            fn(key, obj[key]);
                    }
                }
            };
        }());
        return {
            join: function(obj) {
                var url = obj.url || '';
                var params = obj.params || { };
                var hash = obj.hash || '';

                if (typeof url !== 'string' ||
                    typeof hash !== 'string' ||
                    typeof params !== 'object')
                    return '';

                if (params.length !== 0) {
                    var paramsUrl = '';
                    forEachKey(params, function(k, v) {
                        if (paramsUrl.length !== 0)
                            paramsUrl += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(v);
                        else
                            paramsUrl = '?' + encodeURIComponent(k) + '=' + encodeURIComponent(v);
                    });
                    url += paramsUrl;
                }
                if (hash.length !== 0)
                    url += '#' + hash;

                return url;
            },
            parse: function(url) {
                var obj = { };
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
                obj.params = { };

                for (var i = 0; i < params.length; i++) {
                    url = params[i].split('=');
                    if (url.length >= 2) {
                        var k = url[0];
                        var v = url.slice(1).join('=');

                        try {
                            k = decodeURIComponent(k);
                        } catch(e) {
                            k = unescape(k);
                        }
                        try {
                            v = decodeURIComponent(v);
                        } catch(e) {
                            v = unescape(v);
                        }

                        if (!obj.params[k] && k.length !== 0 && v.length !== 0)
                            obj.params[k] = v;
                    }
                }

                return obj;
            },
        };
    }());

    var doQueryCaptcha = function(query, onCaptcha, onData) {

        function onPreData(data) {
            if (!data || !data.captcha) {
                onData(data);
                return;
            }

            var obj = urlmodule.parse(data.url);
            onCaptcha(data.url, function(input) {
                obj.serial = data.serial;
                obj.udig = input;
                doQueryCaptcha(urlmodule.join(obj), onCaptcha, onPreData);
            });
        }

        $.getJSON(query, onPreData);
    };

    return {
        getTrackListFromArtistURL: function(artistURL, onEnd) {

            function onData(data) {
                if (!data || !data.artist || !data.artist.lyrics || !data.artist.lyrics.item) {
                    onEnd([]);
                    return;
                }
                var musicList = [];
                for (var i = 0; i < data.artist.lyrics.item.length; i++) {
                    musicList.push({
                        id: data.artist.lyrics.item[i].id,
                        name: data.artist.lyrics.item[i].desc,
                    });
                }
                onEnd(musicList);
            }

            if (typeof artistURL !== 'string' ||
                typeof onEnd !== 'function')
                return vagalume;

            if (artistURL.charAt(artistURL.length - 1) !== '/')
                artistURL += '/';

            $.getJSON(artistURL + 'index.js', onData);

            return vagalume;
        },
        getTrackIdFromName: function(artistName, songName, onEnd) {

            function onData(data) {
                if (!data || !data.type || data.type === 'notfound' || !data.art) {
                    onEnd({ });
                    return;
                }

                var obj = {
                    artist: {
                        name: data.art.id,
                        url: data.art.url,
                        picURL_small: data.art.pic_small,
                        picURL_medium: data.art.pic_medium,
                    },
                };

                if (data.type !== 'exact' || data.mus.length === 0) {
                    onEnd(obj);
                    return;
                }

                obj.song = {
                    id: data.mus[0].id,
                    name: data.mus[0].name,
                };
                onEnd(obj);
            }

            if (typeof songName === 'function' && !onEnd) {
                onEnd = songName;
                songName = '';
            } else if (!songName)
                songName = '';

            if (!artistName ||
                typeof onEnd !== 'function')
                return null;

            $.getJSON(
                'http://www.vagalume.com.br/api/search.php?' +
                    'art=' + encodeURIComponent(artistName) +
                    '&mus=' + encodeURIComponent(songName) +
                    '&nolyrics&extra=artpic',
                onData
            );

            return vagalume;
        },
        getTrackInfoFromName: function(artistName, songName, onCaptcha, onEnd) {

            function onData(data) {
                if (!data || !data.type || data.type === 'notfound' ||
                    !data.art || !data.mus || data.mus.length <= 0) {
                    onEnd({ });
                    return;
                }

                var obj = {
                    artist: {
                        name: data.art.name,
                        url: data.art.url,
                        picURL_small: data.art.pic_small,
                        picURL_medium: data.art.pic_medium,
                    }
                };
                if (data.type !== 'exact') {
                    onEnd(obj);
                    return;
                }

                obj.song = {
                    name: data.mus[0].name,
                    lyrics: data.mus[0].text,
                    youtubeId: data.mus[0].ytid,
                };

                if (data.mus[0].alb) {
                    obj.song.album = {
                        name: data.mus[0].alb.name,
                        year: data.mus[0].alb.year,
                        picURL: data.mus[0].alb.img,
                    };
                }

                onEnd(obj);
            }

            if (!artistName ||
                !songName ||
                typeof onCaptcha !== 'function' ||
                typeof onEnd !== 'function')
                return null;

            doQueryCaptcha(
                'http://www.vagalume.com.br/api/search.php?' +
                    'art=' + encodeURIComponent(artistName) +
                    '&mus=' + encodeURIComponent(songName) +
                    '&extra=alb,ytid,artpic',
                onCaptcha,
                onData
            );

            return vagalume;
        },
        getTrackInfoFromId: function(musicId, onCaptcha, onEnd) {

            function onData(data) {
                if (!data || !data.type || data.type === 'notfound' ||
                    !data.art || !data.mus || data.mus.length <= 0) {
                    onEnd({ });
                    return;
                }

                var obj = {
                    artist: {
                        name: data.art.name,
                        url: data.art.url,
                        picURL_small: data.art.pic_small,
                        picURL_medium: data.art.pic_medium,
                    }
                }; // This shouldn't be possible, but who knows...
                if (data.type !== 'exact') {
                    onEnd({
                        artist: {
                            name: data.art.name,
                            url: data.art.url,
                        },
                    });
                    return;
                }

                obj.song = {
                    name: data.mus[0].name,
                    lyrics: data.mus[0].text,
                    youtubeId: data.mus[0].ytid,
                };

                if (data.mus[0].alb) {
                    obj.song.album = {
                        name: data.mus[0].alb.name,
                        year: data.mus[0].alb.year,
                        picURL: data.mus[0].alb.img,
                    };
                }

                onEnd(obj);
            }

            if (!musicId ||
                typeof onCaptcha !== 'function' ||
                typeof onEnd !== 'function')
                return null;

            doQueryCaptcha(
                'http://www.vagalume.com.br/api/search.php?' +
                    'musid=' + encodeURIComponent(musicId) +
                    '&extra=alb,ytid,artpic',
                onCaptcha,
                onData
            );

            return vagalume;
        },
        
        // reciclar tudo daqui para baixo
        // com pontos e vírgulas
        getMusic: function(artist, music, callback) {

            function onData(data) {
                if (!data || !data.type || data.type === 'notfound' || !data.art) {
                    callback({ });
                    return;
                }

                var obj = {
                    artist: data.art
                };

                // Sometimes the vagalume api will return exact cases together with
                // variation of the songs and data.type will be set to 'approx'.
                // This is bad! Re-write this to check which song in the list
                // has the same "raw name" as the requested and notify the user somehow.
                // Better allow the user to choose between approx songs.
                if (!data.mus) { // || data.mus.length !== 1) { // data.type !== 'exact'
                    obj.song = null; // data.mus[0];
                } else {
                    obj.song = {
                        id: data.mus[0].id,
                        name: data.mus[0].name,
                        lyrics: data.mus[0].text,
                        vagamule_url: data.mus[0].url
                    };
                }
                callback(obj);
            }

            if (!artist || typeof callback !== 'function')
                return null;

            console.log('http://www.vagalume.com.br/api/search.php?' +
                'art=' + encodeURIComponent(artist) +
                '&mus=' + encodeURIComponent(music) +
                '&extra=artpic');
            $.getJSON(
                'http://www.vagalume.com.br/api/search.php?' +
                    'art=' + encodeURIComponent(artist) +
                    '&mus=' + encodeURIComponent(music) +
                    '&extra=artpic',
                onData
            );

            return null;
        },
        artistExists: function(artist, callback, onerror) {
            var artist = artist.toLowerCase().trim();
            var url = "http://www.vagalume.com.br/api/search.php?art=" + encodeURIComponent(artist);

            function onData(data) {
                if (data.art &&
                    data.art.name.toLowerCase() === artist) { // don't alow close matches!
                    console.log(artist, data.art.name);
                    callback(true);
                } else
                    callback(false);
            }

            $.getJSON(url)
                .success(onData)
                .error(onerror);
            return vagalume;
        },
        songExists: function(artist, song, callback, onerror) {
            // callback(null, data) if artist doesn't exist.
            // callback(false, data) if song didn't match completely
            // callback(true, data) if song matched.

            var url = "http://www.vagalume.com.br/api/search.php?" +
                "art=" + encodeURIComponent(artist) +
                "&mus=" + encodeURIComponent(song);

            function onData(data) {
                if (!data.art) // artist doesn't exist
                    callback(null, data);
                else if (data.type !== 'exact')
                    callback(false, data);
                else
                    callback(true, data);
            }

            $.getJSON(url)
                .success(onData)
                .error(onerror);
            return vagalume;
        },
        // método interno => tirar do return e colocar lá em cima
        getRawSongName: function(name) {
            return String(name).replace(/\s?\(.*$/, '');
        },
        // método interno => tirar do return e colocar lá em cima
        getArtistURL: function(name, callback) {

            function onData(data) {
                if (data.type === 'notfound') {
                    callback(null);
                    return;
                } else if (data.art.name.toLowerCase().trim() !== name) {
                    console.debug('not an exact match');
                    onerror();
                    return;
                }

                callback(data.art.url);
            }

            var name = name.toLowerCase().trim();
            var url = "http://www.vagalume.com.br/api/search.php?art=" + encodeURIComponent(name);
            $.getJSON(url)
                .success(onData)
                .error(onerror);
        },
        getArtistSongs: function(artist, callback) {

            vagalume.getArtistURL(artist, function(url) {
                if (!url) {
                    callback({ type: 'notfound' });
                    return;
                }

                function inArray(value, array) {
                    for (var i = 0; i < array.length; i++)
                        if (array[i] === value)
                            return true;
                    return false;
                }

                function onData(data) {
                    if (!data.artist)
                        return callback({ });
                    var all = data.artist.lyrics.item, songs = [];
                    for (var i = 0; i < all.length; i++) {
                        if (!all[i].desc || inArray(vagalume.getRawSongName(all[i].desc), songs))
                            continue;
                        songs.push(vagalume.getRawSongName(all[i].desc));
                    }

                    var obj = {
                        songs: songs,
                        artist: {
                            name: data.artist.desc,
                            genre: data.artist.genre,
                            lyrics: data.artist.lyrics,
                            pic_small: 'http://www.vagalume.com.br/' + data.artist.pic_small,
                            pic_medium: 'http://www.vagalume.com.br/' + data.artist.pic_medium,
                            rank: data.artist.rank,
                            topLyrics: data.artist.toplyrics,
                            url: data.artist.url
                        }
                    };
                    callback(obj);
                }

                $.getJSON(url + '/index.js', onData);
            });
        },
    };
}());