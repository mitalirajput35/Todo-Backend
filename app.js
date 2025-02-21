
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
    if(existingUser){
        return res.status(400).json({message: "User already exists"});
    }
    const user = new userModel({username: username, email: email, password: password})
    await user.save();

    console.log(user._id)
    let token = jwt.sign({email : email, id : user._id}, process.env.SECRET_KEY, { expiresIn: "1h" })
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
app.post("/createTask", isLoggedin,  async (req,res)=>{
    let user = await userModel.findOne({email: requested_user.email})
    
    const {task, description, status} = req.body;
    let generated_uid = uid.uid(8)

    let created_task = await taskModel.create({
        user: user._id,
        task_id: generated_uid,
        title: task,
        description: description,
        status: status,
    })

    user.tasks.push(created_task._id);
    await user.save();

    console.log("User",user)
    console.log("tasks",created_task)

    res.status(200).json(created_task)
})

app.get("/readTask", isLoggedin ,async (req, res)=>{
    try{
        let user = await userModel.findOne({email: requested_user.email}).populate("tasks")
        if(user.tasks.length == 0){
            return res.status(404).json({message: "No task found"})
        }
        return res.json(user.tasks)
    }catch(error){
        return res.status(500)
    }
})

//PROVIDES BOTH ALL USERS AND SPECIFIC USER BY EMAIL MATCHING
app.post("/readUser", isLoggedin ,async (req, res)=>{
    try{
        let allUser;
        if(Object.keys(req.body).length === 0){
             allUser = await userModel.find({})
        }else{
            let {email}= req.body
             allUser = await userModel.find({ email : email })
        }
        if(allUser.length == 0){
            return res.status(404).json({message: "No User found"})
        }
        return res.json(allUser)
    }catch(error){
        return res.status(500).json({ message: "Server Error" })
    }
})
// PROVIDES ALL USERS PRESENT IN THE DB
// app.get("/readUser", async (req, res)=>{
//     try{
//         let allUser = await userModel.find({})
//         if(allUser.length == 0){
//             return res.status(404).json({message: "No User found"})
//         }
//         return res.json(allUser)
//     }catch(error){
//         return res.status(500)
//     }
// })

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

app.delete("/delete/:id", isLoggedin, async (req, res)=>{
    const tid = req.params.id;
    let user = await userModel.findOne({email: requested_user.email})
    let task = await taskModel.findOne({task_id : tid})
    let task_arr = user.tasks
    // console.log("Before DELETION ",task_arr.length)

    if(!task){
        return res.status(404).json({message: "Task Not Found"})
    }
    // checking task belongs to right user

    if(user._id.toString() !== task.user.toString()){
        return res.status(200).json({message: "This Task belongs to another userr"})
    }else{
        let index = task_arr.findIndex(id => id.equals(task._id))
        task_arr.splice(index, 1)
        await taskModel.findOneAndDelete({task_id : tid})
        
        // console.log("After DELETION ",task_arr.length)
        return res.status(200).json({message: "task deleted successfully", task})
    }
   
})
app.patch("/update",isLoggedin, async (req, res)=>{
    try {

        console.log(req.body)
        let task_id = req.body.task_id
        let user = await userModel.findOne({email: requested_user.email})
        let task = await taskModel.findOne({task_id: task_id})
        
        
        
        if(!task){
            return res.status(404).json({message: "Task Not Found"})
        }

        if(user._id.toString() !== task.user.toString()){
            return res.status(200).json({message: "This Task belongs to another userr"})
        } else {

            let updated_task = await taskModel.findOneAndUpdate({task_id: task_id}, req.body, {new: true})
            return res.status(200).json({message: "Task Updated Successfully", updated_task})
        }
        
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({message: "Internal Server Error"})
        
    }
})

function isLoggedin(req, res, next){
    if(!req.cookies.token){
        return res.status(401).json({ message: "Login in required"})
    } else {
        let data = jwt.verify(req.cookies.token, process.env.SECRET_KEY)
        requested_user = data
        next();
    }
}
PORT = process.env.PORT
app.listen(PORT, (err)=>{
    if(err) console.log(err);
});