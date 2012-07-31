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

	//




	// do stuff;
	window.SearchBar = function () {
		
		this.topArtists = null
		var _this = this;

		this.changeTypeahead = function (elem, obj) {
			// this updates 
			if ($(elem).data('typeahead')) {
				for (var p in obj)
				if (obj.hasOwnProperty(p))
					$(elem).data('typeahead')[p] = obj[p]
			} else {
				console.log('typeahead didn\'t exist on', elem)
				$(elem).typeahead(obj)
			}
		}

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

		document.querySelector("#search-artist").onfocus = function () {
			_this.getTopArtists(function (list) {
				_this.changeTypeahead($("#search-artist"), { source: list });
			});
		}

		document.querySelector("#search-music").onfocus = function () {
			var name = document.querySelector("#search-artist").value;
			if (!name) {
				_this.changeTypeahead($("#search-music"), { source: [] });
			}

			function onData (bool) {
				function onData (list) {
					console.log('list of songs for', name, list);
					_this.changeTypeahead($("#search-music"), { source: list });
				}
				if (!bool) { // artist was not found
					console.log('artist', name, 'not found');
					_this.changeTypeahead($("#search-artist"), { source: [] });
					return;
				}

				vagalume.getArtistSongs(name, onData);				
			}

			vagalume.artistExists(name, onData);
		}

		document.querySelector('#searchbar form').onsubmit = function () {
			var artist = encodeURIComponent(document.querySelector('#search-artist').value);
			var music = encodeURIComponent(document.querySelector('#search-music').value);
			window.location.hash = '#!search:' + artist + ':' + music;
			return false;
		}
	}

})(window, window.document);