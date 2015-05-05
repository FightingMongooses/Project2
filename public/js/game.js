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
            var posi = "label" + pos;
            var img = "img" + pos;
            document.getElementById(img).src = "data:image/png;base64,"+data;
        });

    }
};
$(document).ready(function () {
    game.eventHandlers();
    socket.emit("game:","Test");
});
