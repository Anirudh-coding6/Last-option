const jwt = require('jsonwebtoken');
const Provider = require('../models/Provider');
const Customer = require('../models/Customer');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateProvider = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'provider') {
      return res.status(403).json({ error: 'Provider access required' });
    }

    const provider = await Provider.findById(decoded.id);
    if (!provider) {
      return res.status(401).json({ error: 'Provider not found' });
    }

    req.provider = provider;
    next();
  } catch (error) {
    console.error('Provider authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authenticateCustomer = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'customer') {
      return res.status(403).json({ error: 'Customer access required' });
    }

    const customer = await Customer.findById(decoded.id);
    if (!customer) {
      return res.status(401).json({ error: 'Customer not found' });
    }

    req.customer = customer;
    next();
  } catch (error) {
    console.error('Customer authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = {
  authenticateProvider,
  authenticateCustomer
};