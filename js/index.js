$('#search-artist').val('Coldplay');
$('#search-music').val('The Scientist');

$('#searchbar form').submit(function () {
    search(
        $('#search-artist').val(),
        $('#search-music').val()
    );
    return false;
});

(function (){
    $.ajaxSetup({
        async: true,
        cache: true,
        error: function (jqXHR, textStatus, errorThrown){
            console.log('AJAX ERROR', jqXHR, textStatus, errorThrown);
        },
        type: 'GET',
        dataType: 'html',
        timeout: 10000,
    });

    var parseHash = function (hash) {
        var page = 'default';
        if (hash && hash.length >= 3 && hash.slice(0, 2) === '#!')
            page = hash.slice(2).split(':')[0].toLowerCase();
        switch (page)
        {
            case 'default':
                return {
                    html: 'default.html',
                    dependencies: [],
                }
            case 'artist':
                return {
                    html: 'artist.html',
                    dependencies: [
                        'js/artist.js'
                    ],
                };
            case 'error':
                return {
                    html: 'error.html',
                    dependencies: [
                        'js/error.js'
                    ],
                }
            default:
                return {
                    html: 'lyrics.html',
                    dependencies: [
                        'js/selector.js',
                        'js/lyrics.js'
                    ],
                };
        }
    };
    
    var currentHash = false;
    setInterval(function () {
        if (window.location.hash !== currentHash) {
            var pageInfo = parseHash(window.location.hash);
            currentHash = window.location.hash;
            $('#content').html('');
            $.ajax({
                url: pageInfo.html,
                success: function (html) {
                    $('#content').html(html);
                    var i = 0;
                    function runNextDependency(pageInfo) {
                        if (i >= pageInfo.dependencies.length)
                            return;
                        $.ajax({
                            url: pageInfo.dependencies[i],
                            dataType: 'script',
                            success: function () {
                                i++;
                                runNextDependency(pageInfo);
                            },
                        });
                    }
                    runNextDependency(pageInfo);
                },
            });
        }
    }, 100);
}());