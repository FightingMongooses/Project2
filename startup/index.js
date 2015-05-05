var fs = require("fs");
var path = require("path");
var filePath = path.join(__dirname, "/../public/Cards.txt");
 
var LineByLineReader = require("line-by-line");
var lr = new LineByLineReader(filePath);

lr.on("error", function(err){
      console.log(err);
});

// get base64 string of image file
/*function base64Image(src){
    return fs.readFileSync(src).toString("base64");
}*/

// These objects are now stored in a text file: /data/CardsJSON.txt

// get card data from file
var Card = mongoose.model("Card");
lr.on("line", function(line){
      var cardData = line.split(" ");
      var imgPath = "/Images/TT"+cardData[0]+".png";
      // encode image
//      var codedImg = base64Image(imgPath);
      var insert = new Card({
            "title": cardData[0],
            "up": cardData[1],
            "right": cardData[2],
            "down": cardData[3],
            "left": cardData[4],
            "picture": imgPath
      });
    insert.save();
      // add card to database
//      cards.push(card);     // array until mongodb is set up

//      console.log(card);
});

// done reading file
lr.on("end", function(){
      console.log("done");
});

