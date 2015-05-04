"use strict";
var buddy = {
    add: function(userEmail){
        socket.emit("buddy:add",{email:userEmail,token:user.info.token});
    },
    remove: function(userId){
        socket.emit("buddy:remove",{id:userId,token:user.info.token});
    },
    modal: {
        add: $( "div#buddyAdd" ).dialog({
            autoOpen: false,
            width: "40%",
            modal: true,
            buttons: {
                "Search": function(){
                    buddy.add($("div#buddyAdd input#buddyEmail").val());
                }
            },
            close: function() {
                // Clear form data too
                buddy.modal.add.dialog( "close" );
            }
        }),
        manage: $( "div#buddyList" ).dialog({
            autoOpen: false,
            width: "40%",
            modal: true,
            open: function(event,ui){
                // Trigger request to get friends list
                socket.emit("buddy:requestList",{token:user.info.token});
            },
            close: function() {
                // Clear form data too
                buddy.modal.manage.dialog( "close" );
            }
        })
    },
    eventHandlers: function () {
        //Override nav clicks
        $("a#buddyAdd").on("click", function (event) {
            event.preventDefault();
            buddy.modal.add.dialog("open");
        });
        $("a#buddyList").on("click", function (event) {
            event.preventDefault();
            buddy.modal.manage.dialog("open");
        });
        // Override pressing enter/submit in modal forms
        buddy.modal.add.find("form").on("submit", function (event) {
            event.preventDefault();
            buddy.add($("div#buddyAdd input#buddyEmail").val());
        });
        //Socket listening events
        socket.on("buddy:list",function(msg){ // Get latest buddy list and replace DOM with it

        });
    }
};
$(document).ready(function () {
    buddy.eventHandlers();
    socket.emit("buddy:","Test");
});