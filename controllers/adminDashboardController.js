const Product=require('../models/Product');const Category=require('../models/Category');const Order=require('../models/Order');
async function page(req,res,next){try{const [products,categories,orders,recent]=await Promise.all([Product.countDocuments(),Category.countDocuments(),Order.countDocuments(),Order.find().sort({createdAt:-1}).limit(6).lean()]);res.render('admin/pages/dashboard',{stats:{products,categories,orders},recentOrders:recent});}catch(e){next(e);}}
module.exports={page};
