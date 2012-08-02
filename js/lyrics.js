// dá merge nessas funções com o selector.js, pra elas não ficarem globais


(function (window, document, undefined) {

    'use strict';

    window.LyricsBox = function (artist, song) {

        var _this = this;
        var htmlScript = document.querySelector("#lyrics-box-html");

        var openTweetPopup = function () {
            var text = document.querySelector('#tweet').value;
            window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text));
        }

        this.disableTweet = function () {
            var counter = document.querySelector('.twtcounter');
            counter.classList.add('exceed');
            document.querySelector('#tweet-button').classList.add('disabled');
        }

        this.enableTweet = function () {
            var counter = document.querySelector('.twtcounter');
            counter.classList.remove('exceed');
            document.querySelector('#tweet-button').classList.remove('disabled');
        }

        this.updateTweetCounter = function () {
            // update characters counter in tweet textarea
            var tweet =  document.querySelector('textarea#tweet').value;
            var counter = document.querySelector('.twtcounter');
            
            counter.innerHTML = tweet.length;
            if (tweet.length > 140)
                _this.disableTweet();
            else _this.enableTweet();
            
            return true;
        }

        var writeLyrics = function (text) {
            // write lyrics given text retrieved from vagalume's api
            // lines must be separated by '\n' and verses by empty lines

            var verses = text.split('\n\n');
            var lyricstag = document.querySelector('.lyrics');

            // clean lyrics
            while (lyricstag.children[0])
                lyricstag.removeChild(lyricstag.children[0]);

            // loop through verses
            for (var i = 0; i < verses.length; i++) {
                var vtag = document.createElement('div');
                var lines = verses[i].split('\n');
                vtag.className = 'verse';

                // loop through lines
                for (var j = 0; j < lines.length; j++) {
                    var ltag = document.createElement('div');
                    var words = lines[j].split(' ');
                    ltag.className = 'line';

                    // loop through words
                    for (var k = 0; k < words.length; k++) {
                        var wtag = document.createElement('span');
                        wtag.className = 'word';
                        wtag.innerHTML = words[k];

                        ltag.appendChild(wtag);
                    }

                    vtag.appendChild(ltag);
                }

                lyricstag.appendChild(vtag);
            }

            Selector.addSelectionEvent();
        }

        function renderHTML () {
            document.querySelector("#content").innerHTML = htmlScript.innerHTML;
        }

        console.log(artist, song)
        vagalume.getMusic(artist, song, function (d) {
            console.log(d)
            writeLyrics(d.music.lyrics)
        })

        renderHTML()

        var tweet = document.querySelector('textarea#tweet');
        tweet.addEventListener('focus', updateTweetCounter);
        tweet.addEventListener('keyup', updateTweetCounter);
        tweet.addEventListener('onchange', updateTweetCounter);
    
    }


})(window, window.document);


(function () {
    return;
    function getMusicId() {
        if (window.location.hash)
            return window.location.hash.slice(2);
        else
            return '';
    }

    vagalume.getMusicInfoFromId(
        getMusicId(),
        function () {
            console.log('oncaptcha', arguments);
        }, function (data) {
            if (!data.music) {
                window.location.hash = '#!error:2';
                return;
            }
            writeLyrics(data.music.lyrics);
            $('#music-name').html(data.music.name);
            $('#artist-name').html(data.artist.name);
        }
    );
}());