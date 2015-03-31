(function( $, window ){
   'use strict';
   var YTPlayer;

   /*
      Helper functions
   */
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

   /*
       Create the popup view
       Note: popup and background share the same process so variables could be exchagned freely
   */

   var playBtnHtml = "<a href='#'><span class='glyphicon glyphicon-fast-play'></span></a>";
   var pauseBtnHtml = "<a href='#'><span class='glyphicon glyphicon-fast-pause'></span></a>";

   var popupHtml = "\
      <label>Play music: </label><input type='text' class='add-music-input'>\
      <div class='player-view'>\
         <div class='control-btn loading-sign'></div>\
         <div class='control-btn action-btn'></div>\
         <div class='control-btn prev-btn'>\
            <a href='#'><span class='glyphicon glyphicon-fast-backward'></span></a>\
         </div>\
         <div class='control-btn next-btn'>\
            <a href='#'><span class='glyphicon glyphicon-fast-forward'></span></a>\
         </div>\
         <div class='progress'>\
            <div class='progress-bar' aria-valuenow='60' aria-valuemin='0' aria-valuemax='100' style='width: 40%'></div>\
         </div>\
         <div class='time'></div>\
      </div>\
   ";

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
            console.log(this.$el.html());
            this.addInput = this.$(".add-music-input");
            console.log(this.addInput);
         },
         events: {
            "keydown .add-music-input" : "onAddSongKeyUp",
            "click .prev-btn" : "onPrevClick"
         },
         renderInitialState: function(){
            // load correct initial state
            //console.log(YTPlayer.player.getPlayerState());
         },
         onAddSongKeyUp: function(evt){
            var key = evt.keyCode || evt.which,
               ENTER_KEY = 13;
            console.log("WHAT");
            if(key == ENTER_KEY){

               var vid = extractYoutubeVid(this.addInput.val());

               YTPlayer.loadId(vid);


               console.log(vid);
               this.addInput.val("");
               evt.preventDefault();

            }
         },
         onActionClick: function(){

         },
         onPrevClick: function(){
            console.log("PREV");
         },
         onNextClick: function(){

         },
         onProgressClick: function(){

         },
         onPlayerStateChange: function(){

         }
      });
   };


   window.compilePopup = function(content){
      var $content = $(content);

      /*
      var input = $("<input type='text' id='add-music'></input>");

      input.on('keydown', function(evt){
         var key = evt.keyCode || evt.which,
            ENTER_KEY = 13;

         if(key == ENTER_KEY){

            var vid = extractYoutubeVid($(this).val());

            player.loadVideoById(vid, 0);
            player.playVideo();

            console.log(vid);
            evt.preventDefault();
         }
      });*/
      var playerView = createPlayerView();
      $content.append(playerView.$el);
      playerView.renderInitialState();
   }


   function success(p){
      // When Youtube library is loaded successfully
      YTPlayer = p;

      p.addOnStateChange(function(evt){
         // buffering: show loading sign

         // playing: show "pause" sign

         // pause: show "playing" sign
         console.log(evt);
      });

      console.log("API loaded");
      //player.playVideo();
   }

   function init(){
      var API = $.loadYoutubeAPI();

      API.then(success);
   }

   init();

})( jQuery, window);
