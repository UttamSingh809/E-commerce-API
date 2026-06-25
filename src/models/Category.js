const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
    name: {
         type: String,
         required:[true,'Category name is required'],
         unique:true,
         trim:true 
    },
    slug:{
          type:String,
          unique:true,
          lowercase:true,
          trim:true
    },
    description: {
         type: String,
          trim:true
    },
    image: {
         type: String 
    },
    parentId: {
         type: mongoose.Schema.Types.ObjectId ,
         ref:'Category',
         default:null
    },
     level: {
          type: Number,
          default: 1,
          min: 1,
          max: 3
     },
    isActive:{
     type:Boolean,
     default:true
    }
},{
     timestamps:true
});

categorySchema.pre('save', async function () {
     if (!this.slug) {
          this.slug = this.name
               .toLowerCase()
               .replace(/[^a-z0-9]+/g, '-')
               .replace(/^-+|-+$/g, '');
     }
});

module.exports = mongoose.model("Category", categorySchema);