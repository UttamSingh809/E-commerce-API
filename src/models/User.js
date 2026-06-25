const mongoose = require('mongoose')
const bcrypt= require('bcrypt')

const userSchema = new mongoose.Schema({
    name: { 
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: { 
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: { 
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false 
    },
    role: {
        type:String,
        enum: ['customer', 'admin', 'super-admin'],
        default: 'customer'
    },
    profile: {
        phone: { 
            type: String 
        },
        avatar: { 
            type: String 
        }
    },
    address: [{
        type: ['shipping', 'billing'],
        isDefault: true,
        street: { 
            type: String 
        },
        city: { 
            type: String 
        },
        zipCode: { 
            type: String 
        },
        country: { 
            type: String 
        },
        phone: { 
            type: String 
        }
    }
    ],
    createdAt: { 
        type: Date 
    },
    updatedAt: { 
        type: Date 
    }
},{
    timestamps:true
})

userSchema.pre('save',async function (){
    if(!this.isModified('password')){
        return
    }
    try{
        const salt=await bcrypt.genSalt(10)
        this.password=await bcrypt.hash(this.password,salt)
    }   
    catch(err){
        console.log(err)
    }
})

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isAdmin = function () {
    return this.role === 'admin' || this.role === 'super-admin';
};

userSchema.methods.getFullName = function () {
    return this.name;
};

module.exports = mongoose.model('User', userSchema)