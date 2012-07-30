// selector.js

// TODO:
// solve compatibility issues for using elm.classList?

(function (window, document, undefined) {
    "use strict";

    String.prototype.trim = String.prototype.trim || function() {
        return String(this).replace(/^\s+|\s+$/g, '')
    }

    String.prototype.removePunctuation = function () {
        return str.trim().replace(/[,.]+$/g, '')
    }

    window.Selector = {

        unselectWords: function () {
            var selected = document.querySelectorAll('.word.selected')
            for (var i = 0; i < selected.length; i++)
                selected[i].classList.remove('selected')
        },

        selectRange: function (a, b) {
            // Make selection starting at A and ending at B.

            var w = Selector.getRange(a, b)
            for (var i = 0; i< w.length; i++)
                w[i].classList.add('selected')
            if (w.length == 0)
                throw Error('no range selected!')
        },

        getSplitRange: function (a, b) {
            // Get list of words in the range, divided according to the lines they're in.

            var words = Selector.getRange(a, b)
                , selection = []
            
            var i = 0, w = null
            while (w = words[i++]) {
                if (selection.length == 0 || (words[i - 2].parentElement !== w.parentElement))
                    selection.push([w])
                else
                    selection[selection.length - 1].push(w)
            }

            return selection
        },

        getRange: function (a, b) {
            // Return the list of words between (an including) A and B.

            if (!a || !b)
                return []
            
            var words = Array.prototype.slice.call(document.querySelectorAll('.word'))
                , ia = words.indexOf(a)
                , ib = words.indexOf(b)

            if (ia < ib)
                first = ia, last = ib
            else if (ia > ib)
                var first = ib, last = ia
            else // ia === ib
                return [a]

            return words.slice(first, last+1)
        },

        getSelectionEnds: function () {
            // Return the words on the extreme of the current selection process.
            if (!hoverWord || !endWord)
                throw Error('why isn\'t hoverWord/endWord set?')
            return [hoverWord, endWord]
        },

        updateTweetBox: function () {
            if (!hoverWord || !endWord) // unselection process: clear tweet and return
                var tweet = ''
            else {
                var lines = Selector.getSplitRange.apply(null, Selector.getSelectionEnds())
                    , lpieces = []
                for (var i = 0; i < lines.length; i++) {
                    var wpieces = []
                    for (var j = 0; j < lines[i].length; j++)
                        wpieces.push(lines[i][j].innerHTML.removePunctuation())
                    lpieces.push(wpieces.join(' '))
                }
                var tweet = lpieces.join(" ♪ ") // ♪ ♫ ♩ ♬ ♭ ♮ ♯ /
            }
            document.querySelector('textarea#tweet').value = tweet
            updateTweetCounter()
        },

        addSelectionEvent: function (words) {
            // Add mouseover/mouseout listener to elements in 'words'.
            // When words is null, use document.querySelectorAll('.word')?

            function mouseoverWord (e) {
                hoverWord = e.target

                if (!mouseDown)
                    return
        
                if (!endWord) {
                    // cursor, after clicked, moved over to a word.
                    // in that case, set endWord to be the first one "hovered".
                    endWord = e.target
                }

                Selector.updateTweetBox()
                Selector.unselectWords()
                Selector.selectRange.apply(null, Selector.getSelectionEnds())
            }
            
            function mouseoutWord(e) {
                if (hoverWord === e.target)
                    hoverWord = null
            }

            var words = words || document.querySelectorAll('.word')
            for (var i = 0; i < words.length; i++) {
                words[i].addEventListener('mouseover', mouseoverWord)
                words[i].addEventListener('mouseout', mouseoutWord)
            }
        },

        // these become available through the Selector
        get endWord() { return endWord },
        get mouseDown() { return mouseDown },
        get hoverWord() { return hoverWord },
        get lastSelected() { return lastSelected }
    };

    // everybody ♥ closures!
    var mouseDown = false // mouse starts unclicked
        , endWord = null // the first word of a selection process, default to null
        , hoverWord = null // the actual word being hovered, default to null 
        , lastSelected = null // the last word selected before 

    var VERBOSE = false
    
    document.onmousedown = function (e) {
        if (e.button !== 0)
            return; // left-click only!

        mouseDown = true
        if (VERBOSE)
            console.log("mousedown")
        
        if (hoverWord) {
            // cursor is ALREADY above a word:
            // fire mouseover event to start selection of the current word.
            Selector.unselectWords()
            var e = document.createEvent("MouseEvents")
            e.initMouseEvent("mouseover")
            hoverWord.dispatchEvent(e)
        }
    }

    document.onmouseup = function (e) {        
        if (e.button !== 0)
            return // left-click only!

        mouseDown = false
        if (VERBOSE)
            console.log("mouseup")
        
        if (hoverWord && endWord) {
            var selected = Selector.getRange.apply(null, Selector.getSelectionEnds())
            if (selected.length === 1) {
                // If only one word is currently selected,
                // check to see if it's an unselection process.
                if (selected[0] === lastSelected) { // Same word was selected last time: unselect it!
                    Selector.unselectWords()
                    endWord = lastSelected = null // Allow for selection next time.
                    Selector.updateTweetBox()
                    return
                } else
                    lastSelected = selected[0]
            }
        }
        endWord = null
    }

})(window, window.document);
