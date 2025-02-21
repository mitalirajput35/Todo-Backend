
const mongoose = require("mongoose")

const taskSchema = mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    task_id:{
        type: String,
        required: true,
        
    },
    title:{
        type: String,
        required: true,
    },
    description:{
        type: String,
    },
    status:{
        type: Boolean,
        default: false,
        
    }

})

module.exports = mongoose.model("task", taskSchema)