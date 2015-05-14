"use strict";
var game = {
    current: null,
    info: {
        players: null,
        turn: null
    },

    board: {
        wipe: function () { // Wipe the board for a new game
            $("#cardSlots").html("");
        },
        load: function (board) { // Load current state of game
            for (var i = 0; i < 9; i++) {
                if (board.card[i] !== null && board.card[i].title !== "Placeholder") {
                    var cardOwner = null;
                    if(board.owner[i] === game.info.players.player1){
                        cardOwner = "player1card";
                    } else {
                        cardOwner = "player2card";
                    }
                    console.log({card: board.card[i]});
                    $("<div></div>")
                        .data("number", i).addClass(cardOwner)
                        .css("background-image", "url(" + board.card[i].picture + ")")
                        .appendTo("#cardSlots")
                        .droppable();
                } else {
                    var dropableConfig = {
                        drop: handleCardDrop,
                        accept: "#cardPile1 div, #cardPile2 div",
                        hoverClass: "hovered"
                    };
                    if(game.info.turn !== user.info.displayname){
                        dropableConfig = {};
                        $("<div></div>")
                            .data("number", i)
                            .appendTo("#cardSlots")
                            .droppable(dropableConfig);
                    } else {
                        $("<div></div>")
                            .data("number", i)
                            .appendTo("#cardSlots")
                            .droppable(dropableConfig);
                    }
                }
            }
        },
        play: function (position, card) {
            socket.emit("game:placeCard", {card: card, position: position, current: game.current});
        }
    },
    cards: {
        wipe: function () { // Wipe all displayed cards
            $("#cardPile1").html("");
            $("#cardPile2").html("");
        },
        load: function (player, cards) { // Load each players cards
            if (typeof cards !== "undefined") {
                for (var i = 0; i < cards.length; i++) {
                    var config = {
                        containment: "#gameBoard",
                        stack: "#cardPile" + player.toString() + " div",
                        cursor: "move",
                        revert: true
                    };
                    if (game.info.players.player1 === user.info.displayname && player !== 1) {
                        config.disabled = true;
                    } else if (game.info.players.player2 === user.info.displayname && player !== 2) {
                        config.disabled = true;
                    }
                    $("<div></div>")
                        .data("number", cards[i]).css("background-image", "url(" + cards[i].picture + ")")
                        .attr("class", "player" + player.toString()+"card")
                        .appendTo("#cardPile" + player.toString()).draggable(config);
                }
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
//            game.board.wipe();
//            game.cards.wipe();
        });
        // Socket event capturing
        socket.on("game:updateBoard", function (data) { // Revise board
            console.log({updateBoard: data});
            $("a#gameJoin").parent().addClass("hidden");
            game.info.players = data.players;
            game.info.turn = data.turn
//            console.log({game:game.info.players,data:data.players});
            //TODO
            game.cards.wipe();
            game.board.wipe();
            game.cards.load(1, data.hands.player1);
            game.cards.load(2, data.hands.player2);
            game.board.load(data.board);
        });
        socket.on("game:complete",function(data){

        });
    }
};
function handleCardDrop(event, ui) {
    var position = $(this).data("number");
    var cardData = ui.draggable.data("number");

    game.board.play(position, cardData);
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
    //}

    // If all the cards have been placed correctly then display a message
    // and reset the cards for another go
}

$(document).ready(function () {
    game.eventHandlers();
    socket.emit("game:", "Test");
});
