(function($, window ){
   'use strict';

   var deferred = $.Deferred();

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


   var events = {
      'onReady': function(){
         // pass a reference to this player object
         deferred.resolve(YTPlayer);
      },
      'onStateChange': function(evt){
         // handle its own handler

         // handle external listeners
         /*_.each(YTPlayer.callbacks, function(cb){
            if(_.isFunction(cb)){
               cb(evt);
            }
         });*/

         if(_.isFunction(YTPlayer.callback)){
            YTPlayer.callback(evt);
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


   /*
      Main player controlling object
   */
   var YTPlayer = {
      init: function(){
         this.callback = null;
         this.title = "";
         this.player = new YT.Player('player', {
            height: '390',
            width: '640',
            events: events
         });
      },
      loadId: function(vid){


         this.player.loadVideoById(vid, 0);
         this.player.playVideo();
      },
      getVideoInfo: function(vid, callback){
         var that = this;
         getVideoInfo(vid).then(function(res){
            that.title = res.title;
            callback(that.title);
         });
      },
      onElapsedUpdate: function(){

      },
      addOnStateChange : function(cb){
         this.callback = cb;
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
