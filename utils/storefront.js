function formatMoney(amount, settings){const n=Number(amount||0);const symbol=settings?.currency?.symbol||'$';const value=Number.isFinite(n)?n.toFixed(2):'0.00';return settings?.currency?.position==='after'?`${value}${symbol}`:`${symbol}${value}`;}
function safeAssetUrl(value){const raw=String(value||'').trim();if(!raw||/^(?:javascript|data|vbscript):/i.test(raw))return '';return raw.startsWith('/')?raw:'';}
function responsiveImageUrl(value){return safeAssetUrl(value);}
function responsiveImageSrcset(value){const safe=safeAssetUrl(value);return safe?`${safe} 640w`:'';}
function categoryLabel(slug,categories=[]){return categories.find(c=>c.slug===slug)?.name||String(slug||'').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())||'Category';}
function productCategoryMessage(category,categories=[]){return `Part of our ${categoryLabel(category,categories)} collection.`;}
function automaticMetaTitle(name,storeName='Store'){return `${String(name||'Product').trim()} — ${storeName}`.slice(0,70);}
module.exports={formatMoney,safeAssetUrl,responsiveImageUrl,responsiveImageSrcset,categoryLabel,productCategoryMessage,automaticMetaTitle};
