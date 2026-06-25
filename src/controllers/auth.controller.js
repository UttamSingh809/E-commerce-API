const User=require('../models/User')
const jwt=require('jsonwebtoken')
const config=require('../config/env')

const generateToken=(userId)=>{
    return jwt.sign({id:userId},config.jwtSecret,{
            expiresIn:'7d'
    })
}

async function register(req,res){
    try{
        const {name,email,password}=req.body
        const existingUser=await User.findOne({email})
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:'User already exists'
            })
        }
        const user=await User.create({name,email,password})
        const token=generateToken(user._id)
        res.status(201).json({
            success:true,
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                role:user.role
            }
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            success:false,
            message:err.message
        })
    }
} 

async function login(req,res){
    try{
        const { email, password } = req.body

        const user=await User.findOne({email}).select('+password')
        if(!user){
            res.status(401).json({
                status:false,
                message:'Invalid credentials'
            })
        }

        const isPasswordValid = await user.comparePassword(password)
        if(!isPasswordValid){
            return res.status(401).json({
                status:false,
                message:'Invalid credentials'
            })
        }

        const token=generateToken(user._id)
        res.json({
            success:true,
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                role:user.role
            }
        })
    }
    catch(err){
        res.status(500).json({
            status:false,
            message:err.message,
        })
    }
}

async function getMe(req, res) {
    try {
        const user = await User.findById(req.user.id).select('-password')
        res.json({
            success: true,
            user
        })
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

module.exports = { register, login, getMe }