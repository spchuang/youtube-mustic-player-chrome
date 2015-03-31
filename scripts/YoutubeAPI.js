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
         _.each(YTPlayer.callbacks, function(cb){
            if(_.isFunction(cb)){
               cb(evt);
            }
         });
      }
   }


   /*
      Main player controlling object
   */
   var YTPlayer = {
      init: function(){
         this.callbacks = [];
         this.player = new YT.Player('player', {
            height: '390',
            width: '640',
            events: events
         });
      },
      loadId: function(vid){
         player.loadVideoById(vid, 0);
         //player.playVideo();
      },

      onElapsedUpdate: function(){

      },

      addOnStateChange : function(cb){
         this.callbacks.push(cb);
      }
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
