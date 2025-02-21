
const express = require("express");
const app = express();
const db = require("./config/connection");
const taskModel = require("./models/taskModel");
const userModel = require("./models/userModel");
const uid = require("uid");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");



app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser())

app.get("/", (req, res)=>{
    res.send("Welcome to the TODO_LIST")
})

app.post("/createUser",  async (req, res)=>{
    
    const {username, email, password} = req.body
    if(username === undefined || email === undefined|| password === undefined){
        return res.status().json({message: "All fields need to be filled"})
    }

    const existingUser = await userModel.findOne({email: email})
    console.log(existingUser)
    if(existingUser){
        return res.status(400).json({message: "User already exists"});
    }
    const user = new userModel({username: username, email: email, password: password})
    await user.save();
    // const user = await userModel.create({
    //     username,
    //     email,
    //     password, 
    // })
    console.log(user)
    let token = jwt.sign({email : email}, process.env.SECRET_KEY, { expiresIn: "1h" })
    return res
    .status(200)
    .cookie("token", token)
    .json({message: "User Creadted successfully" , user})
})

app.get("/logout", (req, res)=>{
    res.clearCookie("token")
    res.json({message: "Logged out successfully" })
})

app.post("/login", async (req, res)=>{

    let {email, password} = req.body
    let user = await userModel.findOne({email: email})

    if(!user){
        return res.status(404).json({message: "User not found" })
    }

    let isMatch = await user.comparePassword(password)
    if(!isMatch){
        return res.status(400).json({message: "Invalid password" })
    } else{

        let token = jwt.sign({email : email}, process.env.SECRET_KEY)
        return res.status(200).cookie("token", token).json({message: "You have logged in successfully"})
    }

    // if(user.password === password){
    //     let token = jwt.sign({email : email}, process.env.SECRET_KEY)
    //     res.status(200).cookie("token", token).json({message: "You have logged in successfully"})
    // }else{

    //     return res.status(200).json({message: "something went wrong"})
    // }
})
app.post("/create", async (req,res)=>{
    const {task, description, status} = req.body;
    const allTask = await taskModel.find({});
    let generated_uid = uid.uid(8)
    let tasks = await taskModel.create({
        task_id: generated_uid,
        title: task,
        description: description,
        status: status,
    })
    res.status(200).json(tasks)
})

app.get("/readTask  ", async (req, res)=>{
    try{
        let allTask = await taskModel.find({})
        if(allTask.length == 0){
            return res.status(404).json({message: "No task found"})
        }
        return res.json(allTask)
    }catch(error){
        return res.status(500)
    }
})
app.get("/readUser", async (req, res)=>{
    try{
        let allUser = await userModel.find({})
        if(allUser.length == 0){
            return res.status(404).json({message: "No User found"})
        }
        return res.json(allUser)
    }catch(error){
        return res.status(500)
    }
})

// app.post("/delete", async (req, res)=>{
//     try {
//         console.log(res.body)
//         let task_id = req.body.task_id
//         let exist_task = await taskModel.findOne({task_id: task_id});
//         console.log(exist_task)
    
//         if(!exist_task){
//             return res.status(404).json({message: "Task Not Found"})
//         }

//         let deleted_task = await taskModel.findOneAndDelete({task_id : task_id});
//         console.log(deleted_task)
//         return res.status(200).json({message: "task Deleted successfully", deleted_task})
        
//     } catch (error) {
//         console.log(error.message)
//         return res.status(500).json({message: "Internal Server Error"})
//     }
// })

app.delete("/delete/:id", async (req, res)=>{
    const tid = req.params.id;
    let exist_task = await taskModel.findOneAndDelete({task_id : tid})
    // let exist_task = await taskModel.findOne({task_id : tid})
    // console.log(exist_task)
    if(!exist_task){
        return res.status(404).json({message: "Task Not Found"})
    }
    return res.status(200).json({message: "task deleted successfully"})
})
app.patch("/update", async (req, res)=>{
    try {
        console.log(req.body)
        let task_id = req.body.task_id
        let exist_task = await taskModel.findOneAndUpdate({task_id: task_id}, req.body, {new: true})

        if(!exist_task){
            return res.status(404).json({message: "Task Not Found"})
        }
        
        return res.status(200).json({message: "Task Updated Successfully", exist_task})
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({message: "Internal Server Error"})
        
    }
})

PORT = process.env.PORT
app.listen(PORT, (err)=>{
    if(err) console.log(err);
});