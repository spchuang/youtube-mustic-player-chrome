(function( $, window ){
   'use strict';
   var YTPlayer;

   /*
      Helper functions
   */
   function getVideoInfo(videoId){

      var deferred = $.Deferred();
      $.get('https://gdata.youtube.com/feeds/api/videos/' + videoId + '?v=2&alt=json')
         .then(function(res) {

             var info = {
                 title: res.entry.title.$t
             }
             deferred.resolve(info);
         })
      return deferred.promise();
   }



   // Extract the vid of the youtube url link
   function extractYoutubeVid(url){
      var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      var match = url.match(regExp);
      if (match && match[2].length == 11) {
         return match[2];
      } else {
         return null;
      }
   }

   // convert time in seconds to formated (HH::MM:SS)
   function toHHMMSS(second) {
      var sec_num = parseInt(second, 10); // don't forget the second param
      var hours   = Math.floor(sec_num / 3600);
      var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
      var seconds = sec_num - (hours * 3600) - (minutes * 60);

      if (hours   < 10) {hours   = "0"+hours;}
      if (minutes < 10) {minutes = "0"+minutes;}
      if (seconds < 10) {seconds = "0"+seconds;}
      var time    = hours+':'+minutes+':'+seconds;
      return time;
   }



   /*
       Create the popup view
       Note: popup and background share the same process so variables could be exchagned freely
   */

   var playBtnHtml = "<a href='#'><span class='glyphicon glyphicon-fast-play'></span></a>";
   var pauseBtnHtml = "<a href='#'><span class='glyphicon glyphicon-fast-pause'></span></a>";

   var popupHtml = "\
      <div class='popup-wrap'>\
      <div><label>Add playlist: </label><input type='text' class='new-name-input'></div>\
      <div><label>Add song: </label><input type='text' class='add-music-input'><span class='loading-sign'></span><div>\
      <label>Playlist: </label><select class='playlist-select-control'></select>\
      <hr>\
      <div class='playlist-wrap list-group'></div>\
      <hr>\
      <div class='video-title'><p></p></div>\
      <div class='player-view'>\
         <div class='control-btn'><img class='loading-sign' src='player-icons/ajax-loader.gif'></div>\
         <div class='control-btn action-btn'></div>\
         <div class='control-btn prev-btn'>\
            <a href='#'><span class='glyphicon glyphicon-fast-backward'></span></a>\
         </div>\
         <div class='control-btn next-btn'>\
            <a href='#'><span class='glyphicon glyphicon-fast-forward'></span></a>\
         </div>\
         <div class='progress'>\
            <div class='progress-bar' aria-valuenow='0' aria-valuemin='0' aria-valuemax='100' style='width: 0%'></div>\
         </div>\
         <div class='progress-text'>\
            <span class='progress-elapsed'></span> / <span class='progress-duration'></span>\
         </div>\
         <div class='time'></div>\
      </div></div>\
   ";

   var playlistSelectTemplate = Handlebars.compile("\
      {{#each playlists}}\
         <option value={{@index}}>{{name}}</option>\
      {{/each}}\
   ");

   var playlistTemplate = Handlebars.compile("\
      {{#each songs}}\
         <a href='#' class='song-item list-group-item' data-vid='{{vid}}' data-title='{{title}}'>\
            {{title}}\
            <span class='badge delete-btn'>x</span>\
         </a>\
      {{else}}\
         <div>empty playlist...</div>\
      {{/each}}\
   ");

   var BaseView = {
      $el: null,
      events: {
         /*
         "click .test" : "callback"
         */
      },
      $: function(selector){
         return this.$el.find(selector);
      },
      init: function(){},
      registerEvents: function(){
         var that = this;
         // value is function name, key is event name
         _.each(this.events, function(val, key){
            var func = that[val];
            var evtName = key.split(" ")[0];
            var selector = key.split(" ")[1];

            // validate if funciton exists
            if(_.isFunction(func)){
               // attach function as event handler and maintain original scope
               that.$el.on(evtName, selector, $.proxy(func, that));
            }else {
               console.log("[ERROR]: " + func + " is not a function");
            }
         })
      },
   }
   var createView =  function(extendView){
      var v = $.extend({}, BaseView, extendView);
      v.init();
      v.registerEvents();
      return v;
   }

   var createPlayerView = function(){
      return createView({
         $el: $(popupHtml),
         init: function(){
            this.addInput = this.$(".add-music-input");
            this.playlistNameInput = this.$(".new-name-input");
            this.playlist = this.$(".playlist-wrap");
            this.playlistSelect = this.$(".playlist-select-control");

            this.elapsed = YTPlayer.player.getCurrentTime();;
            this.duration = YTPlayer.player.getDuration();
            this.state = YTPlayer.player.getPlayerState();

            // keeping track of which playlist is currently displaying (not necessarily the one playing)
            this.currentPlaylistIndex = YTPlayer.playlist.currentPlaylistIndex;
         },
         events: {
            "keydown .add-music-input" : "onAddSongKeyUp",
            'click .action-btn': 'onActionClick',
            'click .next-btn' : 'onNextClick',
            "click .prev-btn" : "onPrevClick",
            'click .progress' : "onProgressClick",
            "keydown .new-name-input": "onPlaylistNameKeyUp",
            "change .playlist-select-control": "onPlaylistSelect"
         },
         updateVideoTitle: function(){
            this.$(".video-title p").text(YTPlayer.playlist.getCurrentTitle());
         },
         updateState: function(){
            // load correct initial state
            this.updateProgressBar();
            this.updateVideoTitle();

            if(this.state === YT.PlayerState.BUFFERING) {
               this.$(".loading-sign").show();
               this.$(".progress-text").hide();
            }else{
               this.$(".loading-sign").hide();
               this.duration = YTPlayer.player.getDuration();

               this.updateElapseText();
               this.$(".progress-text .progress-duration").text(toHHMMSS(this.duration));
               this.$(".progress-text").show();
            }

            if (this.state === YT.PlayerState.PLAYING) {
               this.$(".action-btn").empty().append("<a href='#'><span class='glyphicon glyphicon-pause'></span></a>");
               this.updateProgess();
            } else{
               this.$(".action-btn").empty().append("<a href='#'><span class='glyphicon glyphicon-play'></span></a>");
            }
         },
         updateElapseText: function(){
            this.$(".progress-text .progress-elapsed").text(toHHMMSS(this.elapsed));
         },
         updateProgressBar: function(){
            var value = this.elapsed / this.duration * 100;
            this.$('.progress-bar').css('width', value+'%').attr('aria-valuenow', value);
         },
         updateProgess: function(){
            var that = this;
            // get updated time
            _.delay(function() {
               that.elapsed = YTPlayer.player.getCurrentTime();
               //that.elapsed = player.getCurrentTime();

               that.updateElapseText();
               that.updateProgressBar();

               // recursive
               that.updateProgess();
            }, 250);
         },
         onPlaylistSelect: function(evt){
            this.currentPlaylistIndex = parseInt($(evt.target).find("option:selected").val());
            this.updatePlaylist();
         },
         onPlaylistNameKeyUp: function(evt){
            var key = evt.keyCode || evt.which,
               ENTER_KEY = 13;
            var that = this;

            if(key == ENTER_KEY){
               // Switch to the new playlist if this is the only one
               if(this.currentPlaylistIndex === null){
                  this.currentPlaylistIndex = 0;
                  YTPlayer.playlist.currentPlaylistIndex = 0;
               }
               YTPlayer.playlist.addPlaylist(this.playlistNameInput.val());
               this.playlistNameInput.val("");

            }
         },
         onAddSongKeyUp: function(evt){
            var key = evt.keyCode || evt.which,
               ENTER_KEY = 13;
            var that = this;

            if(key == ENTER_KEY){
               // you can't add until it is a legitimate video

               var vid = extractYoutubeVid(this.addInput.val());
               if (vid){
                  // show loading sign
                  this.$(".loading-sign").text("loading...");
                  getVideoInfo(vid).then(function(res){
                     that.$(".loading-sign").text("");
                     that.addInput.val("");

                     // if this is successful, close loading sign, add song to playlist
                     YTPlayer.playlist.addSong(that.currentPlaylistIndex,
                     {
                        vid: vid,
                        title: res.title
                     });
                  });
               }

               evt.preventDefault();
            }
         },
         onActionClick: function(){
            if(this.state === YT.PlayerState.PLAYING) {
               YTPlayer.pause();
            } else {
               YTPlayer.play();
            }
         },
         onPrevClick: function(){
            YTPlayer.playlist.prevSong();
         },
         onNextClick: function(){
            YTPlayer.playlist.nextSong();
         },
         onProgressClick: function(evt){
            // detect the horizontal position of the click
            var offset = $(evt.target).offset();
            var x = evt.clientX - offset.left;

            // calculate the time to seek
            var time = x/$(evt.target).width() * this.duration;

            this.elapsed = time;
            this.updateProgressBar();

            YTPlayer.seekTo(time);
         },
         onStateChange: function(evt){

            // response to player state changes
            this.state = evt.data;
            this.updateState();
         },
         renderPlaylist: function(){
            // NOTE: this only gets triggered once initially to display the playlist and register the event handlers

            this.updatePlaylist(true);
            var that = this;

            // only need to register this once, since we attach the event listener on parent div wrapper
            this.playlist.on('click', '.song-item', function(evt){
               var index = $(evt.target).closest(".song-item").index();
               YTPlayer.playlist.playAtIndex(that.currentPlaylistIndex, index);
            });

            this.playlist.on('click', '.delete-btn', function(evt){
               var index = $(evt.target).closest('.song-item').index();
               YTPlayer.playlist.deleteSong(that.currentPlaylistIndex, index);
               evt.stopPropagation();
            });
         },
         updatePlaylist: function(renderSelect){
            // rerender the playlist (add/delete songs), flag to render the select component (if add/remove selects)
            var that = this;

            if(renderSelect){
               // render select
               this.playlistSelect.empty().append(playlistSelectTemplate({
                  playlists: YTPlayer.playlist.list
               }));
               this.playlistSelect.children().eq(YTPlayer.playlist.currentPlaylistIndex).attr("selected","selected");
            }
            // render song list from the current playlist
            this.playlist.empty().append(playlistTemplate({
               songs: YTPlayer.playlist.getPlaylist(this.currentPlaylistIndex)
            }));

            // if the currently viewing playlist is the same as the one playing
            if(this.currentPlaylistIndex === YTPlayer.playlist.currentPlaylistIndex && YTPlayer.playlist.currentIndex != null) {
               this.playlist.children().eq(YTPlayer.playlist.currentIndex).addClass("active");;
            }
         }
      });
   };

   window.compilePopup = function(content){
      var $content = $(content);

      var playerView = createPlayerView();

      YTPlayer.registerCallbacks({
         onStateChange: $.proxy(playerView.onStateChange,playerView),
         onPlaylistChange: $.proxy(playerView.updatePlaylist,playerView)
      });

      playerView.updateState();
      playerView.renderPlaylist();
      $content.append(playerView.$el);
   }


   function success(p){
      // When Youtube library is loaded successfully
      YTPlayer = p;
      YTPlayer.player.setVolume(100);
      YTPlayer.player.unMute();

      console.log("API loaded");
   }

   function init(){
      var API = $.loadYoutubeAPI();

      API.then(success);
   }

   init();

})( jQuery, window);
