(function () {
    function getArtistUrl() {
        if (!window.location.hash)
            return '';
        return 'http://www.vagalume.com.br/' + window.location.hash.slice(2).split(':')[1] + '/';
    }
    
    vagalume.getMusicListFromArtistUrl(
        getArtistUrl(),
        function (data) {
            if (data.length === 0) {
                window.location.hash = '#!error:2';
                return;
            }
            for (var i = 0; i < data.length; i++) {
                $('#content ol').append(
                    $('<li>').append(
                        $('<a>').attr('href', '#!' + data[i].id).append(
                            data[i].name
                        )
                    )
                );
            }
        }
    );
}());