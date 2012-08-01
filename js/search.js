var search = (function () {
    function onData(data) {
        if (!data.artist) {
            // Not even the artist was found.
            window.location.hash = '#!error:1';
        } else if (!data.music) {
            // We have a valid artist name and URL here, but the music wasn't found.
            var urlPath = data.artist.url.split('/');
            var artistUrl = '';
            for (var i = urlPath.length - 1; i >= 0; i++) {
                artistUrl = urlPath[i];
                if (artistUrl.length !== 0)
                    break;
            }
            window.location.hash = '#!artist:' + artistUrl;
        } else {
            // Perfect match, redirect to the music page.
            window.location.hash = '#!' + data.music.id;
        }
    }
    return (function (artistName, musicName) {
        vagalume.getMusicIdFromName(
            artistName,
            musicName,
            onData
        );
    });
}());