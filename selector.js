// selector.js

// TODO:
// solve compatibility issues for using elm.classList?

(function (window, document, undefined) {
    
    function removePunctuation(str) {
        return str.replace(/^\s|\s+$/g, '').replace(/[,.]+$/g, '');
    }

    window.Selector = {

        unselectWords: function () {
            // Unselect words, by removing their "selected" class.
            var selected = document.querySelectorAll('.word.selected');
            for (var i = 0; i < selected.length; i++)
                selected[i].classList.remove('selected');
        },

        selectRange: function (a, b) {
            // make selection starting at A and ending at B

            var w = Selector.getRange(a, b);
            for (var i = 0; i< w.length; i++)
                w[i].classList.add('selected');
            if (w.length == 0)
                throw Error('no range selected!');
        },

        getSplitRange: function ( a, b ) {
            // Get list of words in the range, divided according to the lines they're in.

            var words = Selector.getRange(a, b);
            var selection = [];
            var i = 0;
            var w;
            while (w = words[i++]) {
                if (selection.length == 0 || (words[i - 2].parentElement !== w.parentElement))
                    selection.push([w]);
                else
                    selection[selection.length - 1].push(w);
            }

            return selection;
        },

        getRange: function (a, b) {
            // return the list of words between (an including) A and B

            if (!a || !b)
                return [];
            
            var words = Array.prototype.slice.call(document.querySelectorAll('.word'));
            var ia = words.indexOf(a)
            var ib = words.indexOf(b)

            if (ia < ib) 
                var first = ia, last = ib;
            else if (ia > ib) 
                var first = ib, last = ia;
            else return [a];  // ia === ib

            return words.slice(first, last+1);
        },

        getSelectionEnds: function () {
            // returns the extreme words in current selection process.
            if (!hoverWord || !endWord)
                throw Error('why isn\'t hoverWord/endWord set?');
            return [hoverWord, endWord];
        },

        updateTweetBox: function () {
            if (!hoverWord || !endWord) {
                // unselection process: clear tweet and return
                document.querySelector('textarea#tweet').value = '';
                updateTweetCounter();
                return;
            }

            var lines = Selector.getSplitRange.apply(null, Selector.getSelectionEnds());
            var lpieces = [];

            for (i = 0; i < lines.length; i++) {
                var wpieces = [];
                for (var j = 0; j < lines[i].length; j++)
                    wpieces.push(removePunctuation(lines[i][j].innerHTML));
                lpieces.push(wpieces.join(' '));
            }

            document.querySelector('textarea#tweet').value = lpieces.join(" ♪ ");  // ♪ ♫ ♩ ♬ ♭ ♮ ♯  // \u266A\u266B\u2669\u266C\u266D\u266E\u266F
            updateTweetCounter();
        },

        addSelectionEvent: function (words) {
            // Add mouseover/mouseout listener to elements in 'words'.
            // When words is null, use document.querySelectorAll('.word')?

            function mouseoverWord(e) {

                hoverWord = e.target;

                if (!mouseDown)
                    return;
        
                if (!endWord) {
                    // cursor, after clicked, moved over to a word.
                    // in that case, set endWord to be the first one "hovered".
                    endWord = e.target;
                }

                Selector.updateTweetBox();
                Selector.unselectWords();
                Selector.selectRange.apply(null, Selector.getSelectionEnds());
            }
            
            function mouseoutWord(e) {
                if (hoverWord === e.target)
                    hoverWord = null;
            }

            words = words || document.querySelectorAll('.word'); // is Selector.ok?
            for (var i = 0; i < words.length; i++) {
                words[i].addEventListener('mouseover', mouseoverWord);
                words[i].addEventListener('mouseout', mouseoutWord);
            }
        }
    };

    //TO DO: remove these globals
    mouseDown = false; // mouse starts unclicked
    endWord = null; // the first word of a selection process, default to null
    hoverWord = null; // the actual word being hovered, default to null
    lastSelected = null; // the last word selected before 
    
    document.onmousedown = function (e) {
        if (e.button !== 0)
            return; // exit if it isn't a left-click

        console.log("=> mousedown");
        mouseDown = true;
        

        if (hoverWord) {
            Selector.unselectWords(); // try to unselect possibly selected words
            // cursor is ALREADY above a word (so select it right away)
            // fire mouseover event to start selection of the current word
            // otherwise it'll wait until the mouse goes over another word.
            var e = document.createEvent("MouseEvents");
            e.initMouseEvent("mouseover");
            hoverWord.dispatchEvent(e);
        }
    }

    document.onmouseup = function ( e ) {        
        if (e.button == 0) { // left-click only
            mouseDown = false;

            console.log("=> mouseup", lastSelected, hoverWord, endWord);

            if (hoverWord && endWord) {
                var selected = Selector.getRange.apply(null, Selector.getSelectionEnds());
                if (selected.length === 1) { // if only 1 word is currently selected
                    if (selected[0] === lastSelected) {
                        // if it was selected last time, unselect it!
                        Selector.unselectWords();
                        endWord = lastSelected = null;
                        Selector.updateTweetBox();
                        return;
                    } else
                        // else, update lastSelected
                        lastSelected = selected[0];
                }
            }

            endWord = null; // hoverWord = null
        }
    };

})(window, window.document);
