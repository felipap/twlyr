// js/searchbar.js

(function (window, document, undefined) {

	'use strict';

	// put these in vagalume.js?
	function _getTopArtists (callback, onerror) {
		var monthlyRankURL = "http://www.vagalume.com.br/api/rank.php?\
			type=art&period=month&limit=300&scope=internacional&period=month"
		
		function onData (data) {
			if (!data.art)
				return onerror(data)
			var top = data.art.month.internacional, artists = []
			for (var i=0; i<top.length; i++)
				artists.push(top[i].name);
			callback(artists)
		}

		$.getJSON(monthlyRankURL, onData, onerror);
	}

	function _getArtistSongs (artist, callback, onerror) {
		var artistURL = 'http://www.vagalume.com.br/'+toVagalumeName(artist)+'/index.js';
		$.getJSON(artistURL, callback, onerror)
	}

	function toVagalumeName (name) { // noobs!
		return String(name).toLowerCase().replace(/^\s+|\s+$/g, '').replace(/\s+/,'-');
	}
	//

	function inArray (value, array) {
		for (var i=0; i<array.length; i++)
			if (array[i] === value)
				return true;
		return false;
	}

	// do stuff;
	window.SearchBar = function () {

		this.topArtists = null
		var _this = this;

		this.getTopArtists = function (callback, onerror) {
			function onData (top) {
				_this.topArtists = top
				console.log('top artists is now [', top.length, ']', top)
				callback(top)
			}
			function onError (data) {
				console.debug('deu M...', data)
				if (typeof onerror !== 'undefined')
					onerror(data)
			}
			if (this.topArtists)
				callback(this.topArtists)
			else {
				
				// make call vagalume.js?
				_getTopArtists(onData, onError)
			}
		}

		this.getArtistSongs = function (artist, callback, onerror) {
			_getArtistSongs(artist, function (data) {
				if (!data.artist)
					return onerror()
				
				var all = data.artist.lyrics.item, lyrics = [];
				for (var i=0; i<all.length; i++) {
					if (inArray(processMusicName(all[i].desc),lyrics))
						continue;
					lyrics.push(processMusicName(all[i].desc));
				}
				callback(lyrics);
			}, onerror)
		}

		document.querySelector("#search-artist").onfocus = function () {
			_this.getTopArtists(function (list) {
				$("#search-artist").typeahead({	source: list, items: 10 });
			});
		}

		document.querySelector("#search-music").onfocus = function () {
			var name = document.querySelector("#search-artist").value;
			if (!name)
				return
			else
				_this.getArtistSongs(name, function (list) {
					console.log('list of songs for', name, list)
					$("#search-music").typeahead({ source: list, items: 10 })
				})
		}

		document.querySelector('#searchbar form').onsubmit = function () {
			var artist = encodeURIComponent(document.querySelector('#search-artist').value);
			var music = encodeURIComponent(document.querySelector('#search-music').value);
			window.location.hash = '#!search:' + artist + ':' + music;
			return false;
		}
	}

})(window, window.document);