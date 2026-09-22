const mongoose=require('mongoose');
const CategorySchema=new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxlength:80},
  slug:{type:String,required:true,unique:true,index:true,lowercase:true,trim:true,maxlength:100},
  icon:{type:String,default:'📦',trim:true,maxlength:32},
  isActive:{type:Boolean,default:true,index:true}
},{timestamps:true});
module.exports=mongoose.model('Category',CategorySchema);
