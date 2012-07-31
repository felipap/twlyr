
function TweetBox() {

    function openTweetPopup () {
        var text = document.querySelector('#tweet').value;
        window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text));
    }

    function disableTweet () {
        var counter = document.querySelector('.twtcounter');
        counter.classList.add('exceed');
        document.querySelector('#tweet-button').classList.add('disabled');
    }

    function enableTweet () {
        var counter = document.querySelector('.twtcounter');
        counter.classList.remove('exceed');
        document.querySelector('#tweet-button').classList.remove('disabled');
    }

    function updateTweetCounter () {
        // update characters counter in tweet textarea
        var tweet =  document.querySelector('textarea#tweet').value;
        var counter = document.querySelector('.twtcounter');
        
        counter.innerHTML = tweet.length;
        if (tweet.length > 140)
            disableTweet();
        else enableTweet();
        
        return true;
    }

    function writeLyrics (text) {
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

    (function () {
        var tweet = document.querySelector('textarea#tweet');
        tweet.addEventListener('focus', updateTweetCounter);
        tweet.addEventListener('keyup', updateTweetCounter);
        tweet.addEventListener('onchange', updateTweetCounter);
    }());

    vagalume.musicInfoFromName(
        $('#search-artist').val(),
        $('#search-music').val(),
        function () {
            console.log('oncaptcha', arguments);
        }, function (data) {
            writeLyrics(data.music[0].lyrics);
            $('#music-name').html(data.music[0].name);
            $('#artist-name').html(data.artist.name);
        }
    );
}