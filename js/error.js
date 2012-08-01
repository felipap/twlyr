(function (hash) {
    var errorCode = 0;
    if (hash && hash.length >= 3 && hash.slice(0, 2) === '#!')
        errorCode = parseInt(hash.slice(2).split(':')[1]);
    var errorTitle, errorDesc;
    
    switch (errorCode) {
        case 1:
            errorTitle = 'Artist not found';
            errorDesc = 'The artist you are looking is not in the database. Are you sure you\'re typing correctly?';
            break;
        case 2:
            errorTitle = 'Song not found';
            errorDesc = 'The song you are looking is not available.';
            break;
        case 3:
            errorTitle = 'Not implemented';
            errorDesc = 'This feature is unavailable. It\'ll be available sooner or later.';
            break;
        default:
            errorTitle = 'Unknown code';
            errorDesc = 'Something happened, but...';
            break;
    }
    
    $('#error-title').html(errorTitle);
    $('#error-desc').html(errorDesc);
    
}(window.location.hash));