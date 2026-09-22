const crypto=require('crypto');
function csrfToken(req,res,next){if(!req.session.csrfToken)req.session.csrfToken=crypto.randomBytes(24).toString('hex');res.locals.csrfToken=req.session.csrfToken;res.cookie('XSRF-TOKEN',req.session.csrfToken,{sameSite:'lax',secure:process.env.NODE_ENV==='production',httpOnly:false});next();}
function requireCsrf(req,res,next){const supplied=req.get('x-csrf-token')||req.body?._csrf;if(!supplied||!req.session?.csrfToken||supplied!==req.session.csrfToken){if(req.accepts('json')&&!req.accepts('html'))return res.status(403).json({success:false,message:'Invalid CSRF token.'});return res.status(403).send('Invalid CSRF token.');}next();}
function globalCsrf(req,res,next){if(!['POST','PUT','PATCH','DELETE'].includes(req.method))return next();if(String(req.get('content-type')||'').toLowerCase().startsWith('multipart/form-data'))return next();return requireCsrf(req,res,next);}
module.exports={csrfToken,requireCsrf,globalCsrf};
