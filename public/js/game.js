"use strict";
var game = {
    current: {
        correctCards: 0
    },

    board: {
        wipe: function () { // Wipe the board for a new game
            game.current.correctCards = 0;
            $("#cardSlots").html("");
        },
        load: function (board) { // Load current state of game
            for (var i = 0; i < 9; i++) {
                $("<div>" + board[i] + "</div>").data("number", i).appendTo("#cardSlots").droppable({
                    accept: "#cardPile1 div, #cardPile2 div",
                    hoverClass: "hovered",
                    drop: handleCardDrop
                });
            }
        }
    },
    cards: {
        wipe: function () { // Wipe all displayed cards
            $("#cardPile1").html("");
            $("#cardPile2").html("");
        },
        load: function (player, cards) { // Load each players cards
            for(var i=0;i<cards.length;i++) {
                $("<div>" + cards[i].title + "</div>")
                    .data("number", cards[i])
                    .attr("id", "player" + player.toString())
                    .appendTo("#cardPile1").draggable({
                        containment: "#content",
                        stack: "#cardPile" + player.toString() + " div",
                        cursor: "move",
                        revert: true
                    });
            }
        }
    },
    eventHandlers: function () {
        // Override clicks
        $("#send-place").click(function (event) {
            event.preventDefault();
            var x = $("#input-x").val();
            var y = $("#input-y").val();
            var card = $("#element").val();
            // check x,y authenticity

            var m = x + "" + y;
//        socket.emit("chat message", m);
            socket.emit("game:placeCard", {card: card, position: m, current: game.current});
//            socket.emit("change turn");
        });
        $("a#gameJoin").click(function (event) {
            event.preventDefault();
            socket.emit("game:connect", {token: user.info.token});
            $("a#gameJoin").parent().addClass("hidden");
            game.board.wipe();
            game.cards.wipe();
            game.board.load();
        });
        // Socket event capturing
        socket.on("game:updateBoard", function (data) { // Revise board
            //TODO
            game.cards.wipe();
            game.cards.load(1,data.hands.player1);
            game.cards.load(2,data.hands.player2);
            // OLD
            var posi = "#pos" + pos;
            var img = "img" + pos;
            console.log(data + " : " + posi);
            $(posi).html("<img src=" + data + ">");
        });
    }
};
function handleCardDrop(event, ui) {
    var slotNumber = $(this).data("number");
    var cardData = ui.draggable.data("number");

    // If the card was dropped to the correct slot,
    // change the card colour, position it directly
    // on top of the slot, and prevent it being dragged
    // again

    //if ( slotNumber == cardNumber ) {
    ui.draggable.addClass("correct");
    ui.draggable.draggable("disable");
    $(this).droppable("disable");
    ui.draggable.position({of: $(this), my: "left top", at: "left top"});
    ui.draggable.draggable("option", "revert", false);
    correctCards++;
    //}

    socket.emit("game:placeCard", {card: cardData, position: slotNumber, current: game.current});
    // If all the cards have been placed correctly then display a message
    // and reset the cards for another go

    if (game.current.correctCards === 9) {
        $("#successMessage").show();
        $("#successMessage").animate({
            left: "380px",
            top: "200px",
            width: "400px",
            height: "100px",
            opacity: 1
        });
    }

}

$(document).ready(function () {
    game.eventHandlers();
    socket.emit("game:", "Test");
});
