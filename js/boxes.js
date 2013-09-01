// js/boxes.js for Twlyr

// TODOs:
// solve compatibility issues for using elm.classList?
// solve functions interface issues ASAP AFAP!

// deixe essa ** aqui, lindo ♥.
String.prototype.trim = String.prototype.trim || function () {
	return String(this).replace(/^\s+|\s+$/g, '')
}

String.prototype.removePunctuation = function () {
	return String(this).replace(/^\s+|\s+$/g, '').replace(/[,.]+$/g, '')
}

String.prototype.capitalize = function () {
	return String(this).replace( /(^|\s)([a-z])/g , function (m, p1, p2) {
		return p1 + p2.toUpperCase();
	});
};

(function (window, document, undefined) {

	'use strict'

	var VERBOSE = true

	window.loadEngine = function () {

		window.decideOnHash = function () {
			// Decide what to do, based hashObj {String artist, String song}
			var hashObj = parseHash();
			if (!hashObj.artist && !hashObj.song) {
				return; // Do nothing when fields aren't selected.
			} else {
				var box;
				if (hashObj.error) {
					box = new ErrorBox('something just hapenned :S');
				} else if (hashObj.artist && hashObj.song) {
					searchSong(hashObj.artist, hashObj.song);
				} else if (hashObj.artist && !hashObj.song) {
					searchSongsBy(hashObj.artist);
				} else {
					box = new ErrorBox('Not all fields were specified. :(');
				}
			}
		}

		window.substituteHash = function (newhash) {
			newhash = "#!" + newhash.replace(/^#\!?/, '');
			location.hash = newhash;
			decideOnHash();
			// if (history && history.pushState)
			// 	history.pushState({module:"leave"}, document.title, this.href);
		}

		window.selectThisSong = function (liObj) {

			substituteHash(encodeURIComponent(liObj.dataset.artist) + ":" + encodeURIComponent(liObj.dataset.song));
		}

		function scrollToContent(what) {
			var p = (what || document.querySelector(".container.result")).offsetTop;
			$('html, body').animate({ scrollTop: p }, {
					duration: 1000,
					step: function (e) {
						window.forcedScroll = true;
					}
				});
		}

		function updateForm(hashObj) {
			var hashObj = hashObj || parseHash();
			document.querySelector("#search-artist").value = hashObj.artist;
			document.querySelector("#search-song").value = hashObj.song;
		}

		function parseHash(hashUrl) {
			// Return {String artist, String song} based on location.hash.
			var hash = (hashUrl || location.hash).replace(/^#\!?/, ''); // remove #! from beginning
			if (hash === 'error') {
				// Remember to take down website when they come up with an artist named 'error'.
				return { artist: null, song: null, error: true };
			}
			var artist = decodeURIComponent(hash.split(':')[0] || '').capitalize(),
				song = decodeURIComponent(hash.split(':')[1] || '').capitalize();
			return { artist: artist, song: song };
		}

		function searchSong(artist, song) {
			vagalume.getTrackInfoFromName(artist, song, function() {
			}, function(data) {
				var box;
				if (!data.artist) {
					if (VERBOSE)
						console.log("here", data)
					box = new ErrorBox({ artist: artist, song: song }, data);
				} else if (!data.song) {
					var html = "<h2>We couldn't find {{song}}</h2><h3>But here's a list of songs by {{artist}}</h3>";
					searchSongsBy(artist, Mustache.render(html, { artist: artist, song: song }));
				} else {
					box = new LyricsBox(data);
					scrollToContent();
				}
			});
		}

		function searchSongsBy(artist, msg) {
			vagalume.getArtistSongs(artist, function(data) {
				if (!data || data.type === 'notfound')
					return;
				var box = new ListBox({ artist: artist }, data, msg);
				scrollToContent();
			});
		}

		document.querySelector("form.form-search").onsubmit = function () {
			var artist = document.querySelector("#search-artist").value.toLowerCase().trim(),
				song = document.querySelector("#search-song").value.toLowerCase().trim();
			if (artist)
				substituteHash("#!" + encodeURIComponent(artist) + ":" + encodeURIComponent(song));
			return false;
		};

		// Stop scrolling animation.
		$('body,html').bind('scroll mousedown DOMMouseScroll mousewheel keyup', function (e) {
			if ( e.which > 0 || e.type == "mousedown" || e.type == "mousewheel"){
				$("html,body").stop();
			}
		})

		window.addEventListener('hashchange', function() {
			decideOnHash();
			updateForm();
		});

		var h = parseHash();
		updateForm(h);
		decideOnHash();
	}

	window.SearchBar = function SearchBar () {

		if (!(this instanceof SearchBar))
			return new SearchBar()

		this.topArtists = null
		this.lastArtistValue = null
		var _this = this

		function _getTopArtists (callback, onerror) {
			var monthlyRankURL = "http://www.vagalume.com.br/api/rank.php?\
				type=art&period=month&limit=300&scope=internacional&period=month"
			
			function onData (data) {
				if (!data.art)
					return onerror(data)
				var top = data.art.month.internacional, artists = []
				for (var i=0; i<top.length; i++)
					artists.push(top[i].name)
				callback(artists)
			}

			$.getJSON(monthlyRankURL, onData, onerror)
		}

		this.changeTypeaheadSource = function (elem, source) {
			// Change list value.
			if ($(elem).data('typeahead')) {
				$(elem).data('typeahead').souce = source
			} else {
				if (VERBOSE)
					console.log('typeahead didn\'t exist on', elem)
				$(elem).typeahead({'source': source})
			}
		}

		this.updateTypeahead = function (elem, source) {
			// Add items to list.
			if ($(elem).data('typeahead')) {
				var original = $(elem).data('typeahead').source;
				for (var i=0; i<source.length; i++) {
					for (var i2=0; i2<original.length; i2++) {
						if (original[i2] === source[i]) {
							break; // Name already exists in the original typeahead array.
						}
					}
					if (i2 === original.length)
						original.push(source[i]);
				}
				_this.changeTypeaheadSource(elem, { source: original })
			} else {
				if (VERBOSE)
					console.log('typeahead didn\'t exist on', elem)
				$(elem).typeahead({'source': source})
			}
		}

		this.getTopArtists = function (callback, onerror) {
			function onData (top) {
				_this.topArtists = top
				if (VERBOSE)
					console.log('top artists is now [', top.length, ']')// top)
				callback(top)
			}
			function onError (data) {
				if (VERBOSE)
					console.debug('deu M... ranking não foi achado', data)
				if (typeof onerror !== 'undefined')
					onerror(data)
			}
			if (_this.topArtists)
				callback(_this.topArtists)
			else {
				// Make it call vagalume.js?
				_getTopArtists(onData, onError)
			}
		}

		function checkActualArtistValue (event) {
			// Tries to match the current value in the artist field with an
			// actual artist's name to append it to the Typeahead list.
 			var input = document.querySelector("#search-artist")
			if (input.value === _this.lastArtistValue)
				return
			else _this.lastArtistValue = input.value
			
			if (!input.value || /^\s*$/.test(input.value))
				return // Blank artist!

			vagalume.artistExists(input.value, function (match, data) {
				if (data.art)
					// Artist found or close match found => update list with matches.
					_this.updateTypeahead($("#search-artist"), [data.art.name])
			})
		}

		document.querySelector("#search-artist").addEventListener('keyup', checkActualArtistValue)
		document.querySelector("#search-artist").addEventListener('input', checkActualArtistValue)
		document.querySelector("#search-artist").addEventListener('paste', checkActualArtistValue)
		document.querySelector("#search-artist").addEventListener('click', checkActualArtistValue)

		document.querySelector("#search-artist").onfocus = function () {
			_this.getTopArtists(function (list) {
				_this.updateTypeahead($("#search-artist"), list)
			})
		}

		document.querySelector("#search-song").onfocus = function () {
			var name = document.querySelector("#search-artist").value
			if (!name) { // Clear typeahead list.
				_this.changeTypeaheadSource($("#search-song"), [])
				return
			}

			function onData (bool) {
				function onData (list) {
					if (VERBOSE)
						console.log('list of songs for', name, list)
					_this.changeTypeaheadSource($("#search-song"), list.songs)
				}
				if (!bool) { // Artist 404;
					if (VERBOSE)
						console.log('artist', name, 'not found')
					_this.changeTypeaheadSource($("#search-artist"), [])
					return;
				}

				vagalume.getArtistSongs(name, onData)
			}

			vagalume.artistExists(name, onData)
		}

		document.querySelector('form#searchbar').onsubmit = function () {
			var artist = encodeURIComponent(document.querySelector('#search-artist').value);
			var song = encodeURIComponent(document.querySelector('#search-song').value);
			window.location.hash = '#!search:' + artist + ':' + song;
			return false; // Prevent page reload.
		}
	}

	window.LyricsBox = function LyricsBox (data) {
		
		if (!(this instanceof LyricsBox))
			return new LyicsBox()

		// Selector is an intern object of the LyricsBox.
		function Selector () {
			
			if (!(this instanceof Selector))
				return new Selector()

			this.unselectWords = function () {
				var selected = document.querySelectorAll('.word.selected')
				for (var i = 0; i < selected.length; i++)
					selected[i].classList.remove('selected')
			}

			this.selectRange = function (a, b) {
				// Make selection starting at A and ending at B.
				var w = _this.getRange(a, b)
				for (var i = 0; i< w.length; i++) {
					/*
					if (w[i].innerHTML.match(/^\(/)) {
						while (!w[i++].innerHTML.match(/\)$/))
							;
					}
					*/
					w[i].classList.add('selected')
				}
				if (w.length == 0)
					throw Error('no range selected!')
			}

			this.getSplitRange = function (a, b) {
				// Get list of words in the range, divided according to the lines they're in.
				var words = _this.getRange(a, b)
					, selection = []
					, i = 0, w = null
				while (w = words[i++]) {
					if (selection.length == 0 || (words[i - 2].parentElement !== w.parentElement))
						selection.push([w])
					else
						selection[selection.length - 1].push(w)
				}

				return selection
			}

			this.getRange = function (a, b) {
				// Return the list of words between (an including) A and B.
				if (!a || !b) return []

				var words = Array.prototype.slice.call(document.querySelectorAll('.word'))
					, ia = words.indexOf(a)
					, ib = words.indexOf(b)
					, first, last

				if (ia < ib)
					return words.slice(ia, ib+1)
				else if (ia > ib)
					return words.slice(ib, ia+1)
				else return [a]
			}

			this.getSelectionEnds = function () {
				// Return the words on the extreme of the current selection process.
				if (!hoverWord || !endWord)
					throw Error('why isn\'t hoverWord/endWord set?')
				return [hoverWord, endWord]
			}

			this.clearTweetBox = function () {
				document.querySelector('textarea.tweet').value = '';
				updateTweetCounter()				
			}

			this.updateTweetBox = function (text) {

				if (!hoverWord || !endWord) { // updating tweet with new selector
					var words = Array.prototype.slice.call(document.querySelectorAll('.word.selected'))
					var lines = _this.getSplitRange.call(null, words[0], words[words.length-1])
				} else
					var lines = _this.getSplitRange.apply(null, _this.getSelectionEnds())
				var lpieces = []
				for (var i = 0; i < lines.length; i++) {
					var wpieces = []
					for (var j = 0; j < lines[i].length; j++)
						wpieces.push(lines[i][j].innerHTML.removePunctuation())
					lpieces.push(wpieces.join(' '))
				}

				function makeAllLower (sep) {
					if (document.querySelector('.make-lowercase .button.active')) {
						var n = []
						for (var i=0; i<sep.length; i++)
							n.push(sep[i].toLowerCase())
						return n
					}
					return sep;
				}

				function removeBrackets (sp) {
					if (document.querySelector('.remove-brackets .button.active')) {
						var n = [];

						return text.replace(/\(.*\)/, "").replace(/\[.*\]/, "").replace(/\{.*\}/, "");
					}
					return sp;
				}

				var sep, tweet;
				sep = document.querySelector('.customize-tweet').dataset.separator
				tweet = removeBrackets(makeAllLower(lpieces)).join(sep?" "+sep+" ":" ")
				document.querySelector('textarea.tweet').value = tweet
				updateTweetCounter()
			}

			this.addSelectionEvent = function (words) {
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

					_this.updateTweetBox()
					_this.unselectWords()
					_this.selectRange.apply(null, _this.getSelectionEnds())
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
			}

			// everybody ♥ closures
			var _this = this
				, mouseDown = false // mouse starts unclicked
				, endWord = null // the first word of a selection process, default to null
				, hoverWord = null // the actual word being hovered, default to null 
				, lastSelected = null // the last word selected before 

			function onMouseDown (e) {
				if (e.button !== 0)
					return; // left-click only!

				mouseDown = true
				if (VERBOSE)
					console.log("mousedown")

				if (hoverWord) {
					// cursor is ALREADY above a word:
					// fire mouseover event to start selection of the current word.
					_this.unselectWords()
					var e = document.createEvent("MouseEvents")
					e.initMouseEvent("mouseover")
					hoverWord.dispatchEvent(e)
				}
			}

			function onMouseUp (e) {
				if (e.button !== 0)
					return // left-click only!

				mouseDown = false
				if (VERBOSE)
					console.log("mouseup")
				
				if (hoverWord && endWord) {
					var selected = _this.getRange.apply(null, _this.getSelectionEnds())
					if (selected.length === 1) {
						// If only one word is currently selected,
						// check to see if it's an unselection process.
						if (selected[0] === lastSelected) { // Same word was selected last time: unselect it!
							_this.unselectWords()
							endWord = lastSelected = null // Allow for selection next time.
							_this.clearTweetBox()
							return
						} else
							lastSelected = selected[0]
					}
				}
				endWord = null
			}

			document.addEventListener("mousedown", onMouseDown)
			document.addEventListener("mouseup", onMouseUp)
		}

		window.openTweetPopup = function () {
			if (document.querySelector('.tweet-button.disabled'))
				return
			var text = document.querySelector('.tweet').value;
			if (document.querySelector('.add-via-twlyr .button.active')
					&& 140-text.length > ' (via @twlyr)'.length)
				text += ' (via @twlyr)'
			window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text));
		}

		var updateTweetCounter = function () {
			// update characters counter in tweet textarea
			var tweet =  document.querySelector('textarea.tweet').value;
			var counter = document.querySelector('.twtcounter');
			
			counter.innerHTML = tweet.length;
			if (tweet.length < 1 || tweet.length > 140)
				_this.disableTweet();
			else _this.enableTweet();
			
			return true;
		}

		var writeLyrics = function (text) {
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

			selector.addSelectionEvent();
		}

		function disableTweet () {
			var counter = document.querySelector('.twtcounter');
			if (document.querySelector('.tweet').value.length !== 0)
				counter.classList.add('exceed');
			document.querySelector('.tweet-button').classList.add('disabled');
			document.querySelector('.tweet-button').onclick = null
		}

		function enableTweet () {
			var counter = document.querySelector('.twtcounter');
			counter.classList.remove('exceed');
			document.querySelector('.tweet-button').classList.remove('disabled');
			document.querySelector('.tweet-button').onclick = openTweetPopup;
		}

		function listenToTextarea () {
			var tweet = document.querySelector('textarea.tweet');
			tweet.addEventListener('focus', updateTweetCounter);
			tweet.addEventListener('keyup', updateTweetCounter);
			tweet.addEventListener('onchange', updateTweetCounter);
		}

		function listenToSeparatorChange () {
			var sepBut = document.querySelectorAll('.customize-tweet .separators button');
			for (var i=0; i<sepBut.length; i++) {
				sepBut[i].addEventListener('click', function (event) {
					if (VERBOSE)
						console.log('separator selected', event.target);
					document.querySelector('.customize-tweet').dataset.separator = event.target.innerHTML;
					selector.updateTweetBox();
				})
			}
		}

		function renderHTML (artist, song, album) {
			var template = document.querySelector('#lyrics-box-html').innerHTML;
			var html = Mustache.render(template, {
				"artist-name": artist.name,
				"song-name": song.name,
				"album-name": (album && album.name) ? (album.name + ' \'' + album.year.slice(2)) : '',
				"artist-url": artist.url,
				"pic-url": (album && album.picUrl) ? album.picUrl : artist.picURL_medium, // pic_small
				"youtubeId": song.youtubeId || ''
			});
			document.querySelector(".container.result").innerHTML = html;
		}

		if (VERBOSE)
			console.log('data received', data);

		var _this = this;
		this.enableTweet = enableTweet;
		this.disableTweet = disableTweet;
		renderHTML(data.artist, data.song, data.song.album)
		listenToTextarea()
		listenToSeparatorChange()
		window.selector = Selector()
		writeLyrics(data.song.lyrics)
	}

	window.ListBox = function ListBox (query, data, custom_msg) {
		// Where query is an object {String artist, String song} requested to the server
		// and data is the object returned.

		if (!(this instanceof ListBox))
			return new ListBox()

		function renderHTML (artist, songs) {
			if (VERBOSE)
				console.log(artist, songs)
			var template = document.querySelector('#list-box-html').innerHTML
				, html = Mustache.render(template, {
					"artist-name": artist.name,
					"artist-url": artist.url,
					"pic-url": artist.pic_medium, // pic_small
					"songs": songs,
					"num-lyrics": songs.length,
					"msg": custom_msg,
				})
			document.querySelector(".container.result").innerHTML = html;
		}

		renderHTML(data.artist, data.songs);
	}

	window.ErrorBox = function (query, data) {
		// Where query is an object {String artist, String song} requested to the server
		// and data is the object returned.
	
		function renderHTML (obj) {
			var html = Mustache.render(template, obj)
			document.querySelector(".container.result").innerHTML = html;
		}

		if (VERBOSE)
			console.log('query', query, 'data', data);
	
		var template = document.querySelector('#error-box-html').innerHTML;
		if (!data && typeof query === 'string') {
			renderHTML({'general-error': query})
		} else if (!data.artist) {
			renderHTML({
				'artist-404': true,
				'artist-name': query.artist
			})
		} else if (!data.song) {
			renderHTML({
				'song-404': true,
				'song-name': query.song,
				'artist-name': query.artist
			})
		} else {
			renderHTML({'unknown-error': true});
		}
	}


})(window, window.document);
