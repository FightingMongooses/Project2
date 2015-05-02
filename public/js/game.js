"use strict";
var game = {
    eventHandlers: function () {
    }
};
$(document).ready(function () {
    game.eventHandlers();
    socket.emit("game:","Test");
});
