var usr = "";
var my_turn = false;

var main = function() {
    "use strict";
    
    //usr = "Username";
    var socket = io();
    
    // need a better way to get username (login authentication)
    if(usr === ""){
        usr = prompt("Enter Username:", usr);
    }
    //usr = "NAME";
    
    // on connection, set username to socket id (on server)
    socket.on('connect', function(){
//        console.log("connected");
        this.emit('set id', usr);
    });
    
    // submit chat message
    $('form').submit(function(event) {
        event.preventDefault();
        socket.emit('send chat message', $('#textfield').val());
        console.log("message sent: " + $('#textfield').val());
        $('#textfield').val('');
        return false;
    });
    
    $('#send-place').click(function(event) {
        event.preventDefault();
        if(my_turn){
        var x = document.getElementById('input-x').value;
        var y = document.getElementById('input-y').value;
        var ele = document.getElementById('element').value;
        // check x,y authenticity
        
        var m = x + "" + y;
//        socket.emit('chat message', m);
        socket.emit('place card', ele, m)
        socket.emit('change turn');
        }
        else{
            $('#messages').append($('<li>').text("not my turn"));
            $('#m')[0].scrollTop = $('#m')[0].scrollHeight;
        }
    });
    /*
    $('#test').click(function(event){
                     
    });*/
    
    socket.on('chat message', function(msg){
              console.log("msg received: " + msg);
        $('#messages').append($('<li>').text(msg));
        $('#m')[0].scrollTop = $('#m')[0].scrollHeight;
    });
    
    socket.on('place element', function(data, pos){
        var posi = 'label' + pos;
        var img = 'img' + pos;
        document.getElementById(img).src = 'data:image/png;base64,'+data;
    });
    
    socket.on('change turn', function(){
              if(!my_turn){
              my_turn = true;
//              var msg = usr + "'s turn";
//              socket.emit('chat message', msg);
              $('#messages').append($('<li>').text("my turn"));
              $('#m')[0].scrollTop = $('#m')[0].scrollHeight;
              }
              else{
              my_turn = false;
              }
              });
    socket.on('alone', function(){
              if(confirm("You lost your opponent, continue playing?")){
              socket.emit('back to lobby');
              location.reload();
              }else{
              window.close();
              }
              });
    
}
$(document).ready(main);