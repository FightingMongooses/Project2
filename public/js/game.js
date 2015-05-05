"use strict";
var game = {
    eventHandlers: function () {
        // Override clicks
        $("#send-place").click(function(event) {
            event.preventDefault();
            var x = $("#input-x").val();
            var y = $("#input-y").val();
            var card = $("#element").val();
            // check x,y authenticity

            var m = x + "" + y;
//        socket.emit("chat message", m);
            socket.emit("game:placeCard", {card:card, position:m});
//            socket.emit("change turn");
        });
        // Socket event capturing
        socket.on("game:updateBoard", function(data, pos){ // Place card on x/y
            var posi = "#pos" + pos;
            var img = "img" + pos;
                  console.log(data + " : " + posi);
                  $(posi).html("<img src=" + data + ">");
        });

    }
};
$(document).ready(function () {
    game.eventHandlers();
    socket.emit("game:","Test");
});
