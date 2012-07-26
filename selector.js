// selector.js

// TODO:
// compatibility issues for using elm.classList?

(function (window, document, undefined) {
	
	window.Selector = {

		unselectWords: function () {
			// Unselect words, by removing their "selected" class.

			selected = document.querySelectorAll('.word.selected') 
			for (var i=0; i<selected.length; i++)
				selected[i].classList.remove('selected')
		}

		, getRange: function ( a, b ) {
			// return the list of words between (an including) A and B

			var w = document.querySelectorAll('.word'),
				selection = [],
				last = null // the item that come at last

			for (var i=0; i<w.length; i++) {
				if (w[i] == a)
					last = b;
				else if (w[i] == b)
					last = a;

				if (last !== null)
					for (; i<w.length; i++) {
						selection.push(w[i])
						if (w[i] == last)
							return selection
					}
			}

			return []
		}

		, selectRange: function ( a, b ) {
			// make selection starting at A and ending at B

			var w = Selector.getRange(a, b)
			for (var i=0; i<w.length; i++)
				w[i].classList.add('selected')
			if (!w[0])
				throw Error('no range selected!')
		}

		, getSelectionEnds: function ( actual ) {
			// returns the extreme words in current selection process.
			// optional argument 'actual', to be used instead of
			// 'hoverWord' as the other extreme other than 'endWord'
			if ((!hoverWord && !actual) || !endWord) {
				// if not in selection process, try to get selected words.
				// Selector.is what works when words are selected by no longer
				// BEING selected = mouse is up.
				var w = document.querySelectorAll('.word.selected')
				return [w[0], w[w.length-1]]
			}
			return [actual || hoverWord, endWord]
		}

		// put outside Selector?
		, updateTweetBox: function () {
			
			var txt = ""
				, w = Selector.getRange.apply(null, Selector.getSelectionEnds())
			
			for (var i=0; i<w.length; i++) {
				txt += w[i].innerHTML + " "
			}

			document.querySelector('textarea#message').value = txt
		}

		, addSelectionEvent: function ( words ) {
			// Add mouseover/mouseout listener to elements in 'words'.
			// When words is null, use document.querySelectorAll('.word')?

			function mouseoverWord ( e ) {
				hoverWord = e.target;

				if (!mouseDown)
					return

				if (!endWord)
					// cursor, after clicked, moved over to a word.
					// in that case, set endWord to be the first one "hovered".
					endWord = e.target;

				Selector.unselectWords()
				Selector.selectRange.apply(null, Selector.getSelectionEnds()) // (e.target, endWord)
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
	};

	mouseDown = false // mouse starts unclicked
	endWord = null // the first word of a selection process, default to null
	hoverWord = null // the actual word being hovered, default to null
	
	document.onmousedown = function ( e ) {
		if (e.button != 0)
			return // exit if it isn't a left-click

		console.log(">> mousedown!", e)
		mouseDown = true
		Selector.unselectWords() // try to unselect possibly selected words
		
		if (hoverWord) {
			// cursor is ALREADY above a word (so select it right away)
			// fire mouseover event to start selection of the current word
			// otherwise it'll wait until the mouse goes over another word.
			var e = document.createEvent("MouseEvents");
			e.initMouseEvent("mouseover", true, true)
			hoverWord.dispatchEvent(e)
		}
			
	}

	document.onmouseup = function ( e ) {		
		if (e.button != 0)
			return
		
		console.log(">> mouseup", e)
		mouseDown = false
		endWord = hoverWord = null
		Selector.updateTweetBox()
	}

})(window, window.document);