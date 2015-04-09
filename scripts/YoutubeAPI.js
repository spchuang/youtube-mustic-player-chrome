(function($, window ){
   'use strict';

   var deferred = $.Deferred();

   var events = {
      'onReady': function(){
         // pass a reference to this player object
         deferred.resolve(YTPlayer);
      },
      'onStateChange': function(evt){
         // handle its own handler

         // handle external listeners
         if(_.isFunction(YTPlayer.callbacks.onStateChange)){
            YTPlayer.callbacks.onStateChange(evt);
         }
      }
   }

   function updateElapsed() {
      _.delay(function() {
         YTCPlayer.elapsed = player.getCurrentTime();

         /*if (YTCPlayer.status === YT.PlayerState.PLAYING) {
           saveState();
        }*/
         updateElapsed();
      }, 250);

   }

   var PlaylistController = function(parent){
      var p = {
         init: function(){
            this.list = [];
            this.parent = parent;
            this.currentPlaylistIndex = null;
            this.currentIndex = null;
            this.currentTitle = "";
         },
         loadFromStorage: function(){
            // this and saveToStorage shoudl be reverse functions
         },
         saveToStorage: function(){

         },
         nextSong: function(){
            // play next song in the playlist (loop)
            var index = this.currentIndex + 1;
            if (index === this.getPlaylist(this.currentPlaylistIndex).length){
               index = 0;
            }
            this.playAtIndex(this.currentPlaylistIndex, index);
         },
         prevSong: function(){
            // play the prev song in the playlist
            var index = this.currentIndex - 1;
            if (index < 0 ){
               index = this.getPlaylist(this.currentPlaylistIndex).length-1;
            }
            this.playAtIndex(this.currentPlaylistIndex, index);
         },
         playAtIndex : function(playlistIndex, index){
            this.currentIndex = index;
            this.currentPlaylistIndex = playlistIndex;

            var song = this.getPlaylist(this.currentPlaylistIndex)[this.currentIndex];
            this.parent.loadVideo(song.vid);
            this.currentTitle = song.title;
            this.parent.callbacks.onPlaylistChange();
         },
         selectPlaylist: function(index){
            if(index >=0 && index < this.list.length){
               this.currentPlaylistIndex = index;
               this.curentIndex = null;
            }
         },
         addPlaylist: function(name){
            // add new playlist
            this.list.push({
               name: name,
               songs: []
            });
            if(this.parent.callbacks){
               this.parent.callbacks.onPlaylistChange(true);
            }
         },
         deletePlaylist: function(index){
            // delete playlist
         },
         addSong: function(playlistIndex, song){
            this.getPlaylist(playlistIndex).push(song);
            if(this.parent.callbacks){
               this.parent.callbacks.onPlaylistChange();
            }
         },
         deleteSong: function(playlistIndex, index){
            // if delete a song from the playlist we're playing right now
            if (this.currentPlaylistIndex === playlistIndex ){
               // when a song is deleted, we have to change the currentIndex to reflect the correct index in the new playlist
               if (this.currentIndex === index) {
                  this.currentIndex = null;
               } else if (this.currentIndex > index){
                  this.currentIndex -= 1;
               }
            }

            // delete song from playlist based on the index
            this.getPlaylist(playlistIndex).splice(index, 1);
            this.parent.callbacks.onPlaylistChange();
         },
         getCurrentTitle: function(){
            return this.currentTitle;
         },
         getPlaylist: function(index){
            return this.list[index].songs;
         }
      };
      p.init();
      return p;
   };

   /*
      Main player controlling object
   */
   var YTPlayer = {
      init: function(){
         this.playlist = PlaylistController(this);
         this.callback = {};
         this.player = new YT.Player('player', {
            height: '390',
            width: '640',
            events: events
         });
      },
      loadVideo: function(vid){
         this.player.loadVideoById(vid, 0);
         this.player.playVideo();
      },
      getVideoInfo: function(vid, callback){
         var that = this;
      },
      seekTo: function(val) {
          this.player.seekTo(val);
      },
      play: function() {
         this.player.playVideo();
      },
      pause: function() {
         this.player.pauseVideo();
      },
      registerCallbacks: function(callbacks){
        // add callback for "onStateChange", "onPlaylistChange"
        this.callbacks = {
           onStateChange: callbacks.onStateChange,
           onPlaylistChange: callbacks.onPlaylistChange
        }
     },
   }

   /*
      Initializing/ Setting up Youtube API
   */

   function loadYouTubeAPIScript(){
      // load the IFrame Player API code asynchronously.
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
   }

   window.onYouTubeIframeAPIReady = function() {
      YTPlayer.init();
   }

   // expose this for global access
   $.loadYoutubeAPI = function(){
      loadYouTubeAPIScript();

      // return promise
      return deferred.promise();
   }

})( jQuery, window);
