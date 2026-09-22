const AdminUser = require('../models/AdminUser');
const { hashPassword, verifyPassword } = require('../utils/passwordHelpers');

function regenerateSession(req) {
  return new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
}

async function establishAdminSession(req, admin) {
  await regenerateSession(req);
  req.session.adminId = String(admin._id);
  req.session.adminSessionVersion = Number(admin.sessionVersion || 1);
}

async function root(req, res, next) {
  try {
    const exists = Boolean(await AdminUser.exists({ singletonKey: 'primary' }));
    if (!exists) return res.redirect('/admin/setup');
    return res.redirect(req.session?.adminId ? '/admin/dashboard' : '/admin/login');
  } catch (error) {
    next(error);
  }
}

async function setupPage(req, res, next) {
  try {
    if (await AdminUser.exists({ singletonKey: 'primary' })) return res.redirect('/admin/login');
    res.render('admin/pages/setup', { error: '' });
  } catch (error) {
    next(error);
  }
}

async function setup(req, res, next) {
  try {
    if (await AdminUser.exists({ singletonKey: 'primary' })) return res.redirect('/admin/login');

    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const confirm = String(req.body.confirmPassword || '');

    if (username.length < 3) return res.status(400).render('admin/pages/setup', { error: 'Username must be at least 3 characters.' });
    if (password.length < 8) return res.status(400).render('admin/pages/setup', { error: 'Password must be at least 8 characters.' });
    if (password !== confirm) return res.status(400).render('admin/pages/setup', { error: 'Passwords do not match.' });

    const admin = await AdminUser.create({
      singletonKey: 'primary',
      username,
      usernameNormalized: username.toLowerCase(),
      passwordHash: await hashPassword(password),
    });

    await establishAdminSession(req, admin);
    res.redirect('/admin/dashboard');
  } catch (error) {
    if (error?.code === 11000) return res.redirect('/admin/login');
    next(error);
  }
}

async function loginPage(req, res, next) {
  try {
    if (!(await AdminUser.exists({ singletonKey: 'primary' }))) return res.redirect('/admin/setup');
    if (req.session?.adminId) return res.redirect('/admin/dashboard');
    res.render('admin/pages/login', { error: '' });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const admin = await AdminUser.findOne({ singletonKey: 'primary', usernameNormalized: username });

    if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
      return res.status(401).render('admin/pages/login', { error: 'Invalid username or password.' });
    }

    admin.lastLoginAt = new Date();
    await admin.save();
    await establishAdminSession(req, admin);
    res.redirect('/admin/dashboard');
  } catch (error) {
    next(error);
  }
}

function logout(req, res, next) {
  req.session.destroy(error => {
    if (error) return next(error);
    res.clearCookie('connect.sid');
    res.redirect('/admin/login');
  });
}

module.exports = { root, setupPage, setup, loginPage, login, logout };
