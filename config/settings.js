const homepage=require('./homepage');
const fields={
  firstName:{enabled:true,required:true,label:'First Name',placeholder:'First name'},lastName:{enabled:true,required:true,label:'Last Name',placeholder:'Last name'},
  phone:{enabled:true,required:true,label:'Phone',placeholder:'Phone number'},email:{enabled:true,required:false,label:'Email',placeholder:'Email address'},
  address:{enabled:true,required:true,label:'Address',placeholder:'Street address'},city:{enabled:true,required:true,label:'City',placeholder:'City'},
  state:{enabled:true,required:false,label:'State / Region',placeholder:'State or region',options:[]},postalCode:{enabled:true,required:false,label:'Postal Code',placeholder:'Postal code'},
  instructions:{enabled:true,required:false,label:'Order Notes',placeholder:'Optional delivery notes'}
};
module.exports=Object.freeze({
  store:{name:'Your Store',tagline:'Quality Products, Simple Shopping',description:'Discover a curated range of products with convenient ordering and reliable service.',logo:'',favicon:'',branding:{showLogo:false,showName:true,showTagline:true,logoSize:'medium',logoCustomSize:46}},
  appearance:{colors:{primary:'#1b3e28',secondary:'#254d34',accent:'#b8922a',pageBackground:'#f5efe6',mainText:'#2a1f14',secondaryText:'#6b5a46',navbarBackground:'#fdfaf5',navbarText:'#6b5a46',footerBackground:'#111d16',footerText:'#f5efe6',buttonBackground:'#1b3e28',buttonText:'#f5efe6',success:'#2d7a4f',cardBackground:'#fdfaf5',border:'#ede4d6'},typography:{headingFont:'Cormorant Garamond, Georgia, serif',bodyFont:'Jost, Arial, sans-serif',baseFontSize:16},buttons:{radius:'4px'},cards:{radius:'4px'}},
  adminAppearance:{theme:'light',accent:'#1b3e28'},navigation:{categoryMenu:{style:'dropdown'}},homepage,
  features:{productSearch:{enabled:true}},
  content:{
    navigation:{searchPlaceholder:'Search products...',homeLabel:'Home',productsLabel:'Products',cartLabel:'Cart',sidebarEyebrow:'NAVIGATION',sidebarHeading:'Browse Store'},
    footer:{aboutText:'Discover quality products with simple online ordering.',shopTitle:'Shop',informationTitle:'Information',contactTitle:'Contact',businessHours:'',shippingLinkLabel:'Shipping Policy',returnLinkLabel:'Return Policy',privacyLinkLabel:'Privacy Policy',termsLinkLabel:'Terms & Conditions',copyrightText:'© '+new Date().getFullYear()+' Your Store. All rights reserved.'},
    storefrontPages:{products:{},productDetail:{},cart:{},checkout:{},orderComplete:{}},
    policies:{heroEyebrow:'STORE INFORMATION',heroHeading:'Store',heroHighlight:'Policies',intro:'Please review the store policies below before ordering.',shippingTitle:'Shipping Policy',shippingBody:'Shipping times and availability depend on the store and destination.',returnTitle:'Return Policy',returnBody:'Contact the store regarding returns, exchanges, or damaged items.',privacyTitle:'Privacy Policy',privacyBody:'Customer information is used only to process and support orders.',terms:{enabled:true,title:'Terms & Conditions',body:'By placing an order, you confirm that the information you provide is accurate and that you agree to the store\'s order terms.'}}
  },
  contact:{email:{enabled:false,value:''},phone:{enabled:false,value:''},address:{enabled:false,value:'',display:''},customMethods:[]},
  checkout:{fields},currency:{code:'USD',symbol:'$',position:'before'},shipping:{enabled:false,deliveryEstimate:'Varies by destination',flatRate:{enabled:false,amount:0},freeShipping:{enabled:false,threshold:0}},
  payments:{checkoutMethods:[{id:'cod',label:'Cash on Delivery',description:'Pay when your order is delivered.',requiresProof:false},{id:'manual',label:'Manual Payment',description:'Arrange an offline payment directly with the store.',requiresProof:false}],cod:{enabled:true},manual:{enabled:true,name:'Manual Payment',instructions:'Arrange payment directly with the store.'}},
  social:{hasAny:false,facebook:{enabled:false,url:''},instagram:{enabled:false,url:''},tiktok:{enabled:false,url:''},youtube:{enabled:false,url:''},twitter:{enabled:false,url:''}},
  seo:{metaTitle:'Your Store — Online Shop',metaDescription:'Browse products and place orders online.',socialImage:''}
});
