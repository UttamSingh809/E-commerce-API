const mongoose = require('mongoose')
const bcrypt= require('bcrypt')

const userSchema = new mongoose.Schema({
    name: { 
        type: String, required: true 
    },
    email: { 
        type: String, required: true, unique: true 
    },
    password: { 
        type: String, hashed: true, required: true 
    },
    role: ['customer', 'admin', 'super-admin'],
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
    return this.role === 'admin' || this.role === 'super_admin';
};

userSchema.methods.getFullName = function () {
    return this.name;
};

module.exports = mongoose.model('User', userSchema)