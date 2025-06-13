const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Provider = require('../models/Provider');
const Joi = require('joi');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Validation schemas
const customerRegisterSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().optional()
});

const providerRegisterSchema = Joi.object({
  businessName: Joi.string().required(),
  ownerName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().required(),
  serviceTypes: Joi.array().items(Joi.string()).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Customer Registration
router.post('/customer/register', async (req, res) => {
  try {
    const { error, value } = customerRegisterSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email: value.email });
    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer already exists with this email' });
    }

    const customer = new Customer(value);
    await customer.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: customer._id, type: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Customer registered successfully',
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Provider Registration
router.post('/provider/register', async (req, res) => {
  try {
    const { error, value } = providerRegisterSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    // Check if provider already exists
    const existingProvider = await Provider.findOne({ email: value.email });
    if (existingProvider) {
      return res.status(400).json({ error: 'Provider already exists with this email' });
    }

    const provider = new Provider(value);
    await provider.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: provider._id, type: 'provider' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Provider registered successfully',
      token,
      provider: {
        id: provider._id,
        businessName: provider.businessName,
        ownerName: provider.ownerName,
        email: provider.email
      }
    });
  } catch (error) {
    console.error('Provider registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Customer Login
router.post('/customer/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const customer = await Customer.findOne({ email: value.email });
    if (!customer) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await customer.comparePassword(value.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: customer._id, type: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// Provider Login
router.post('/provider/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const provider = await Provider.findOne({ email: value.email });
    if (!provider) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await provider.comparePassword(value.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: provider._id, type: 'provider' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      provider: {
        id: provider._id,
        businessName: provider.businessName,
        ownerName: provider.ownerName,
        email: provider.email
      }
    });
  } catch (error) {
    console.error('Provider login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type === 'customer') {
      const customer = await Customer.findById(decoded.id).select('-password');
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      res.json({ type: 'customer', user: customer });
    } else if (decoded.type === 'provider') {
      const provider = await Provider.findById(decoded.id).select('-password');
      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }
      res.json({ type: 'provider', user: provider });
    } else {
      res.status(400).json({ error: 'Invalid token type' });
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;