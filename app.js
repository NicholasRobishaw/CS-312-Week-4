// includes
const express = require("express");
const bodyParser = require("body-parser");
// include the date.js file that holds the 2 date functions
const mongoose = require("mongoose");
const _ = require("lodash");

// have the app use the includes
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

// connect to data base
//mongoose.connect("mongodb://localhost:27017/todolistDB");
mongoose.connect("mongodb+srv://nr768:jxCA4E8A0tfrsypW@cluster0.l0igmye.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
    name: String
});

// create mongoose model
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this button to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// display the root page
app.get("/", function(req, res){

    // check for items in db to dislay to todolist
    Item.find().then((foundItems) => {
        
        // if the database is empty then add the default items to the db
        if(foundItems.length === 0){
            // attempt to insert all default items
            Item.insertMany(defaultItems).then(() => {
                console.log("Items sucessfully added");
            }).catch((err) => {
                console.log(err);
            });

            // once comepleted refresh the page to show the defualt items
            res.redirect("/");
        }
        // otherwise assume database has items
        else{
            // diplay the items in the collection. render the list.ejs file
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }

        // display all items in the console
        console.log(foundItems);  
       
    // error catch here
    }).catch((err) => {
        console.error('Error fetching items:', err);
        res.status(500).send("Error fetching items");
    });

});

// create dynamic route
app.get("/:customListName", function(req, res){
    // grab the custom list name
    const customListName = _.capitalize(req.params.customListName);

    // check is list already exists
    List.findOne({name: customListName}).then((foundList) =>{
        if(!foundList){
            // create the new list
            const list = new List({
                name: customListName,
                items: defaultItems
            });
        
            // save the new list
            list.save();
            res.redirect("/" + customListName)
        }
        else{
            // show existing list
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }

    }).catch((err) =>{
        console.log(err);
    })

});

// process requests from root
app.post("/", function(req, res){
    // adding a new item to the list
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
    
        res.redirect("/");
    }
    else{
        List.findOne({name: listName}).then((foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        }).catch((err) =>{
            console.log(err);
        });
    }

});

app.post("/delete", function(req, res) {
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndDelete(checkedItemID).then(() => {
            console.log("sucessfully deleted item");
            res.redirect("/");
        }).catch((err) =>{
            console.log(err);
        });
    }
    else{
        List.findOneAndUpdate(
            {name: listName}, 
            {$pull: {items: {_id: checkedItemID}}} 
        ).then((foundList) => {
            res.redirect("/" + listName);
        }).catch((err) => {
            console.log(err);
        })
    }

});



// display the about page
app.get("/about", function(req, res){
    res.render("about");
})

// display server log
app.listen(3000, function(){
    console.log("Server running on port 3000");
});