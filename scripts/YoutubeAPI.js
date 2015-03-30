(function( $, window ){
   var deferred = $.Deferred();
   var player;
   var callback;
   var events =  {
      'onReady': function(){

         console.log("Youtube player loaded");
      },
      'onStateChange': function(evt){
         if(_.isFunction(callback)){
            callback(evt);
         }
      }
   }

   function loadYouTubeAPIScript(){
      // load the IFrame Player API code asynchronously.
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
   }

   window.onYouTubeIframeAPIReady = function() {
      player = new YT.Player('player', {
         height: '390',
         width: '640',
         events: events
      });
   }




   $.loadYoutubeAPI = function(){
      loadYouTubeAPIScript();
      
      // return promise
      return deferred.promise();

   }

})( jQuery, window);
