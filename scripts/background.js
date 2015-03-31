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
      <label>Play music: </label><input type='text' class='add-music-input'>\
      <hr>\
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
            this.elapsed = 0;
            this.duration = 0;

            this.state = YTPlayer.player.getPlayerState();
         },
         events: {
            "keydown .add-music-input" : "onAddSongKeyUp",
            'click .action-btn': 'onActionClick',
            'click .next-btn' : 'onNextClick',
            "click .prev-btn" : "onPrevClick",
            'click .progress' : "onProgressClick"
         },
         updateState: function(){
            // load correct initial state

            //console.log(this.state);
            //this.$(".loading-sign").text("");
            if(this.state === YT.PlayerState.BUFFERING) {
               this.$(".loading-sign").show();
               this.$(".progress-text").hide();
            }else{
               this.$(".loading-sign").hide();
               this.duration = YTPlayer.player.getDuration();
               
               this.$(".progress-text .progress-elapsed").text(toHHMMSS(this.elapsed));
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
         updateProgess: function(){
            var that = this;
            // get updated time
            _.delay(function() {
               that.elapsed = YTPlayer.player.getCurrentTime();
               //that.elapsed = player.getCurrentTime();
               var value = that.elapsed / that.duration * 100;

               that.$(".progress-text .progress-elapsed").text(toHHMMSS(that.elapsed));
               that.$('.progress-bar').css('width', value+'%').attr('aria-valuenow', value);

               that.updateProgess();
            }, 250);
         },
         onAddSongKeyUp: function(evt){
            var key = evt.keyCode || evt.which,
               ENTER_KEY = 13;
            if(key == ENTER_KEY){

               var vid = extractYoutubeVid(this.addInput.val());
               if (vid){
                  YTPlayer.loadId(vid);
                  this.$(".loading-sign").show();
                  this.$(".progress-text").hide();
                  this.addInput.val("");
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
            console.log("PREV");
         },
         onNextClick: function(){
            console.log("Next");
         },
         onProgressClick: function(evt){
            // detect the horizontal position of the click
            var offset = $(evt.target).offset();
            var x = evt.clientX - offset.left;

            // calculate the time to seek
            var time = x/$(evt.target).width() * this.duration;

            YTPlayer.seekTo(time);
         },
         onPlayerStateChange: function(evt){
            // response to player state changes
            this.state = evt.data;
            this.updateState();
         }
      });
   };

   window.compilePopup = function(content){
      var $content = $(content);

      var playerView = createPlayerView();


      YTPlayer.addOnStateChange($.proxy(playerView.onPlayerStateChange,playerView));
      playerView.updateState();
      $content.append(playerView.$el);
   }


   function success(p){
      // When Youtube library is loaded successfully
      YTPlayer = p;
      /*
      p.addOnStateChange(function(evt){
         // buffering: show loading sign

         // playing: show "pause" sign

         // pause: show "playing" sign

      });*/


      console.log("API loaded");
      //player.playVideo();
   }

   function init(){
      var API = $.loadYoutubeAPI();

      API.then(success);
   }

   init();

})( jQuery, window);
