// selector.js

// TODO:
// compatibility issues for using elm.classList?

(function (window, document, undefined) {
	
	window.Selector = {

		unselectWords: function () {
			// Unselect words, by removing their "selected" class.
			var selected = document.querySelectorAll('.word.selected') 
			for (var i=0; i<selected.length; i++)
				selected[i].classList.remove('selected')
		}

		, selectRange: function ( a, b ) {
			// make selection starting at A and ending at B

			var w = Selector.getRange(a, b)
			for (var i=0; i<w.length; i++)
				w[i].classList.add('selected')
			if (!w[0])
				throw Error('no range selected!')
		}

		, getSplitRange: function ( a, b ) {
			// Get list of words in the range, divided according to the lines they're in.

			var words = Selector.getRange(a, b)
				, selection = []
				, i = 0
			while (w = words[i++]) {
				
				if (!selection[0] || (words[i-2].parentElement !== w.parentElement))
					selection.push([w])
				else
					selection[selection.length-1].push(w)
			}

			return selection
		}

		, getRange: function ( a, b ) {
			// return the list of words between (an including) A and B

			if (!a || !b)
				return []
			
			var words = Array.prototype.slice.call(document.querySelectorAll('.word'))
				, ia = words.indexOf(a)
				, ib = words.indexOf(b)

			if (ia < ib) 
				var first = ia, last = ib
			else if (ia > ib) 
				var first = ib, last = ia
			else return [a]  // ia === ib

			return words.slice(first, last+1)
		}

		, getSelectionEnds: function ( ) {
			// returns the extreme words in current selection process.
			if (!hoverWord || !endWord)
				throw Error('why isn\'t hoverWord/endWord set?')
			return [hoverWord, endWord]
		}

		, updateTweetBox: function () {
			
			var lines = Selector.getSplitRange.apply(null, Selector.getSelectionEnds())
				, lpieces = []
				, i = 0

			while (line = lines[i++]) {
				var wpieces = [], i2 = 0
				while (word = line[i2++])
					wpieces.push(word.innerHTML)
				lpieces.push(wpieces.join(' '))
			}

			document.querySelector('textarea#tweet').value = lpieces.join(" ♬ ")  // ♪ ♫ ♩ ♬ ♭ ♮ ♯ 
			updateTweetCounter()
		}

		, addSelectionEvent: function ( words ) {
			// Add mouseover/mouseout listener to elements in 'words'.
			// When words is null, use document.querySelectorAll('.word')?

			function mouseoverWord ( e ) {

				hoverWord = e.target

				if (!mouseDown)
					return
		
				if (!endWord)
					// cursor, after clicked, moved over to a word.
					// in that case, set endWord to be the first one "hovered".
					endWord = e.target

				Selector.updateTweetBox()
				Selector.unselectWords()
				Selector.selectRange.apply(null, Selector.getSelectionEnds())
			}
			
			function mouseoutWord ( e ) {
				if (hoverWord === e.target)
					hoverWord = null
			}

			var words = words || document.querySelectorAll('.word') // is Selector.ok?
			for (var i=0; i<words.length; i++) {
				words[i].addEventListener('mouseover', mouseoverWord)
				words[i].addEventListener('mouseout', mouseoutWord)
			}
		}
	}

	mouseDown = false // mouse starts unclicked
	endWord = null // the first word of a selection process, default to null
	hoverWord = null // the actual word being hovered, default to null
	
	document.onmousedown = function ( e ) {
		if (e.button != 0)
			return // exit if it isn't a left-click

		console.log("=> mousedown")
		mouseDown = true
		
		if (hoverWord) {
			Selector.unselectWords() // try to unselect possibly selected words
			// cursor is ALREADY above a word (so select it right away)
			// fire mouseover event to start selection of the current word
			// otherwise it'll wait until the mouse goes over another word.
			var e = document.createEvent("MouseEvents")
			e.initMouseEvent("mouseover")
			console.log('pseudo mouseover event fired on', hoverWord)
			hoverWord.dispatchEvent(e)
		}
			
	}

	document.onmouseup = function ( e ) {		
		if (e.button == 0) { // left-click only
			console.log("=> mouseup")
			mouseDown = false
			endWord = hoverWord = null
		}
	}

})(window, window.document);
