const mongoose=require('mongoose');
const VariantSchema=new mongoose.Schema({
  weight:{type:String,default:'Standard',trim:true,maxlength:40},
  price:{type:Number,required:true,min:0.01},
  stock:{type:Number,required:true,default:0,min:0,validate:{validator:Number.isInteger,message:'Stock must be a whole number.'}}
},{_id:true});
const ProductSchema=new mongoose.Schema({
  id:{type:String,required:true,unique:true,index:true},
  name:{type:String,required:true,trim:true,maxlength:120},
  slug:{type:String,required:true,unique:true,index:true,lowercase:true,trim:true,maxlength:120},
  desc:{type:String,required:true,trim:true,maxlength:5000},
  category:{type:String,required:true,index:true,lowercase:true,trim:true,maxlength:100},
  emoji:{type:String,default:'📦',maxlength:16},
  images:{type:[String],default:[],validate:{validator:v=>Array.isArray(v)&&v.length<=4,message:'A product can have at most 4 images.'}},
  variants:{type:[VariantSchema],required:true,validate:{validator:v=>Array.isArray(v)&&v.length===1,message:'Lite Edition products use one standard price/stock option.'}},
  isActive:{type:Boolean,default:true,index:true},
  createdAt:{type:Date,default:Date.now},updatedAt:{type:Date,default:Date.now}
});
module.exports=mongoose.model('Product',ProductSchema);
