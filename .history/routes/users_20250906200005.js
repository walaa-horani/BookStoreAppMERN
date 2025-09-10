const express = require("express")
const router = express.Router()

const User = require("../models/UserSchema")
const bcrypt = require("bcrypt")
const {cookieAuth} = require("../auth/middleware")
const jwt = require("jsonwebtoken")
router.post("/register", async(req,res)=> {
    const {email , password, name} = req.body
    if(!email || !password || !name){
        return res.status(400).json({message:"Email and Name and password are required"})

           }

    let user = await User.findOne({email})  
    if(user){
        return res.status(400).json({message:"User Already Exists"})
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    
    const newUser = new User({
        email,
        password:hashedPassword,
        name,
        role: "user",
    })

    await newUser.save()

    let token = jwt.sign({email,id:newUser._id,role: newUser.role},process.env.SECRET_KEY,{expiresIn:"1w"})

   res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,

   })

    res.status(201).json({ message: "User registered successfully", user: newUser, token,role: newUser.role });


})

router.post("/signin", async(req,res)=> {
    const {password, email} = req.body

    if(!email || !password ){
        return res.status(400).json({message:"Email and Name and password are required"})

       }

       let user = await User.findOne({email})

       if(user && await bcrypt.compare(password, user.password)){
         

       
        
        const role = (user.role || "user").trim()
       let token = jwt.sign({email,id:user._id , role},process.env.SECRET_KEY,{expiresIn:"1w"}) 


      res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,

   })

       

       const redirectPath  = role === "admin" ? "/admin" : "/"
      console.log({ role, redirectPath });
    return   res.status(200).json({ message: "User Signin successfully",user, token , role, redirect : redirectPath});
       }
       else{

     return res.status(400).json({ message: 'Invalid email or password' });
       }

     


})



router.get("/verify" , cookieAuth , async(req,res)=>{
    try {
        const  user = await User.findById(req.user.id).select("-password")
         if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        res.status(200).json({
            message:"Token valid",
             user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        })
    } catch (error) {

      res.status(401).json({ message: "Invalid token" });
        
    }
})

router.post("/logout", (req,res)=>{
    res.clearCookie("token",{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    })

    res.status(200).json({ message: "Logged out successfully" }); 
})


router.get("/:id", async(req,res)=> {
    const user = await User.findById(req.params.id)

    if(!user){
        return res.status(404).json({message:"User Not Found"})
    }

    return res.status(200).json({user})
})



module.exports = router;
