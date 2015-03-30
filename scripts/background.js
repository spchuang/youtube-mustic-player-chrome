(function( $ ){
   'use strict';




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


   function compilePopup(content){
      var $content = $(content);

      var input = $("<input type='text' id='add-music'></input>");


      input.on('keydown', function(evt){
         var key = evt.keyCode || evt.which,
            ENTER_KEY = 13;

         if(key == ENTER_KEY){

            var vid = extractYoutubeVid($(this).val());

            player.loadVideoById(vid, 0);
            player.stop();

            console.log(vid);
            evt.preventDefault();
         }

      });
      $content.append(input);
   }

   function init(){
      $.loadYoutubeAPI();
   }

   init();

})( jQuery);
