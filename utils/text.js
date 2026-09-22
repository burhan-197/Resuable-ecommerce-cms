function slugify(value){return String(value||'').normalize('NFKD').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);}
function cleanText(value,max=1000){return String(value||'').replace(/\0/g,'').trim().slice(0,max);}
function escapeRegex(value){return String(value||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function metaDescription(value,fallback=''){const t=cleanText(value||fallback,500).replace(/\s+/g,' ');return t.length<=155?t:`${t.slice(0,152).trim()}...`;}
module.exports={slugify,cleanText,escapeRegex,metaDescription};
