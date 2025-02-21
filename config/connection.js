
const mongoose = require("mongoose");
const config = require("config");
require("dotenv").config();

mongoose
.connect(`${process.env.MONGODB_URI}/TODO_LIST`,{
})
.then(()=>{
    console.log("Connected to MongoDB");
})
.catch((err)=>{
    console.log(err.message);
})

module.exports = mongoose.connection;