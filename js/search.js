var search = (function () {
    function onData(data) {
        if (!data.artist) {
            // Not even the artist was found.
            window.location.hash = '#!error:1';
        } else if (!data.music) {
            // We have a valid artist name and URL here, but the music wasn't found.
            // Show a music list from the found artist, and let the user choose one.
            // To be implemented.
            window.location.hash = '#!error:2';
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