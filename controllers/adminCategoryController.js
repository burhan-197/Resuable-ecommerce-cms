const Category = require('../models/Category');
const Product = require('../models/Product');
const { slugify, cleanText } = require('../utils/text');

async function unique(name, ignore = null) {
  const base = slugify(name) || `category-${Date.now()}`;
  let slug = base;
  let n = 2;
  while (await Category.exists({ slug, ...(ignore ? { _id: { $ne: ignore } } : {}) })) slug = `${base}-${n++}`;
  return slug;
}

async function page(req, res, next) {
  try {
    const cats = await Category.find().sort({ name: 1 }).lean();
    const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    const map = new Map(counts.map(x => [x._id, x.count]));
    res.render('admin/pages/categories', {
      categories: cats.map(c => ({ ...c, productCount: map.get(c.slug) || 0 })),
      error: String(req.query.error || ''),
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const name = cleanText(req.body.name, 80);
    if (!name) return res.redirect('/admin/categories?error=' + encodeURIComponent('Category name is required.'));
    await Category.create({ name, slug: await unique(name), icon: '📦', isActive: true });
    res.redirect('/admin/categories');
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const name = cleanText(req.body.name, 80);
    if (!name) return res.redirect('/admin/categories?error=' + encodeURIComponent('Category name is required.'));

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).send('Category not found.');

    const oldName = category.name;
    const oldSlug = category.slug;
    const nextSlug = await unique(name, category._id);

    category.name = name;
    category.slug = nextSlug;
    await category.save();

    if (oldSlug !== nextSlug) {
      try {
        await Product.updateMany({ category: oldSlug }, { $set: { category: nextSlug } });
      } catch (error) {
        // Keep the catalogue consistent if updating product references fails.
        category.name = oldName;
        category.slug = oldSlug;
        await category.save().catch(() => {});
        throw error;
      }
    }

    res.redirect('/admin/categories');
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.redirect('/admin/categories');
    if (await Product.exists({ category: category.slug })) {
      return res.redirect('/admin/categories?error=' + encodeURIComponent('Move or delete products in this category first.'));
    }
    await category.deleteOne();
    res.redirect('/admin/categories');
  } catch (error) {
    next(error);
  }
}

module.exports = { page, create, update, remove };
