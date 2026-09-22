const Product = require('../models/Product');
const Category = require('../models/Category');
const { slugify, cleanText } = require('../utils/text');
const { saveImages, deleteImages } = require('../services/imageService');

async function uniqueSlug(name, ignore = null) {
  const base = slugify(name) || `product-${Date.now()}`;
  let slug = base;
  let n = 2;
  while (await Product.exists({ slug, ...(ignore ? { _id: { $ne: ignore } } : {}) })) slug = `${base}-${n++}`;
  return slug;
}

async function newId() {
  for (let i = 0; i < 6; i++) {
    const id = `PRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    if (!(await Product.exists({ id }))) return id;
  }
  return `PRD-${Date.now()}`;
}

async function categories() {
  return Category.find({ isActive: true }).sort({ name: 1 }).lean();
}

async function list(req, res, next) {
  try {
    const [rows, cats] = await Promise.all([Product.find().sort({ createdAt: -1 }).lean(), categories()]);
    const map = new Map(cats.map(c => [c.slug, c.name]));
    res.render('admin/pages/products', {
      products: rows.map(p => ({
        ...p,
        categoryName: map.get(p.category) || p.category,
        price: Number(p.variants?.[0]?.price || 0),
        stock: Number(p.variants?.[0]?.stock || 0),
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function newPage(req, res, next) {
  try {
    res.render('admin/pages/product-form', { product: null, categories: await categories(), error: '' });
  } catch (error) {
    next(error);
  }
}

async function editPage(req, res, next) {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).send('Product not found.');
    res.render('admin/pages/product-form', { product, categories: await categories(), error: '' });
  } catch (error) {
    next(error);
  }
}

function formProduct(req, existing = null) {
  return {
    ...(existing ? existing.toObject() : {}),
    name: req.body.name,
    description: req.body.description,
    desc: req.body.description,
    category: req.body.category,
    price: req.body.price,
    stock: req.body.stock,
    variants: [{
      weight: 'Standard',
      price: req.body.price,
      stock: req.body.stock,
    }],
  };
}

async function renderValidationError(req, res, existing, message) {
  return res.status(400).render('admin/pages/product-form', {
    product: formProduct(req, existing),
    categories: await categories(),
    error: message,
  });
}

async function save(req, res, next, existing = null) {
  let newImages = [];
  let savedSuccessfully = false;
  try {
    const name = cleanText(req.body.name, 120);
    const desc = cleanText(req.body.description, 5000);
    const category = cleanText(req.body.category, 100).toLowerCase();
    const price = Number(req.body.price);
    const stock = Number(req.body.stock);

    if (!name || !desc) return renderValidationError(req, res, existing, 'Name and description are required.');
    if (!Number.isFinite(price) || price <= 0) return renderValidationError(req, res, existing, 'Price must be greater than zero.');
    if (!Number.isInteger(stock) || stock < 0) return renderValidationError(req, res, existing, 'Stock must be a non-negative whole number.');
    if (!(await Category.exists({ slug: category, isActive: true }))) return renderValidationError(req, res, existing, 'Choose a valid category.');

    if (req.files?.length) newImages = await saveImages(req.files);

    const oldImages = existing?.images ? [...existing.images] : [];
    const removeCurrent = String(req.body.removeImages || '') === '1';
    const nextImages = newImages.length ? newImages : (removeCurrent ? [] : oldImages);

    if (existing) {
      existing.name = name;
      existing.slug = await uniqueSlug(name, existing._id);
      existing.desc = desc;
      existing.category = category;
      existing.images = nextImages;
      existing.variants = [{ weight: 'Standard', price, stock }];
      existing.updatedAt = new Date();
      await existing.save();
      savedSuccessfully = true;

      if (newImages.length || removeCurrent) await deleteImages(oldImages);
      return res.redirect('/admin/products');
    }

    await Product.create({
      id: await newId(),
      name,
      slug: await uniqueSlug(name),
      desc,
      category,
      emoji: '📦',
      images: nextImages,
      variants: [{ weight: 'Standard', price, stock }],
      isActive: true,
      updatedAt: new Date(),
    });
    savedSuccessfully = true;
    return res.redirect('/admin/products');
  } catch (error) {
    if (!savedSuccessfully && newImages.length) await deleteImages(newImages);
    next(error);
  }
}

async function create(req, res, next) {
  return save(req, res, next, null);
}

async function update(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send('Product not found.');
    return save(req, res, next, product);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (product) await deleteImages(product.images || []);
    res.redirect('/admin/products');
  } catch (error) {
    next(error);
  }
}

module.exports = { list, newPage, editPage, create, update, remove };
