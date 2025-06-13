const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { authenticateProvider } = require('../middleware/auth');
const Joi = require('joi');

// Validation schema
const leadSchema = Joi.object({
  name: Joi.string().required().trim(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  serviceType: Joi.string().valid('plumbing', 'electrical', 'landscaping', 'hvac', 'roofing', 'cleaning', 'renovation', 'other').required(),
  message: Joi.string().allow(''),
  source: Joi.string().valid('website', 'referral', 'instagram', 'facebook', 'google', 'other').default('website')
});

// Create new lead (public endpoint)
router.post('/', async (req, res) => {
  try {
    const { error, value } = leadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const lead = new Lead(value);
    
    // Calculate AI score
    lead.calculateScore();
    
    await lead.save();

    res.status(201).json({
      message: 'Lead created successfully',
      lead: {
        id: lead._id,
        name: lead.name,
        serviceType: lead.serviceType,
        score: lead.score,
        category: lead.getScoreCategory(),
        createdAt: lead.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      error: 'Failed to create lead',
      message: error.message
    });
  }
});

// Get all leads (protected - providers only)
router.get('/', authenticateProvider, async (req, res) => {
  try {
    const { status, serviceType, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (serviceType) filter.serviceType = serviceType;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const leads = await Lead.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('assignedTo', 'businessName ownerName');

    const total = await Lead.countDocuments(filter);

    // Calculate scores for all leads
    const leadsWithScores = leads.map(lead => {
      lead.calculateScore();
      return {
        ...lead.toObject(),
        category: lead.getScoreCategory()
      };
    });

    res.json({
      leads: leadsWithScores,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      error: 'Failed to fetch leads',
      message: error.message
    });
  }
});

// Get single lead
router.get('/:id', authenticateProvider, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'businessName ownerName');
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    lead.calculateScore();
    
    res.json({
      ...lead.toObject(),
      category: lead.getScoreCategory()
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({
      error: 'Failed to fetch lead',
      message: error.message
    });
  }
});

// Update lead status
router.patch('/:id/status', authenticateProvider, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const validStatuses = ['pending', 'contacted', 'qualified', 'converted', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    lead.status = status;
    if (status === 'contacted' && !lead.responseTime) {
      lead.responseTime = new Date();
    }

    if (notes) {
      lead.notes.push({
        content: notes,
        createdBy: req.provider.id
      });
    }

    // Add interaction
    lead.interactions.push({
      type: 'follow_up',
      description: `Status updated to ${status}`,
      timestamp: new Date()
    });

    // Recalculate score
    lead.calculateScore();
    
    await lead.save();

    res.json({
      message: 'Lead status updated successfully',
      lead: {
        ...lead.toObject(),
        category: lead.getScoreCategory()
      }
    });
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({
      error: 'Failed to update lead status',
      message: error.message
    });
  }
});

// Add interaction to lead
router.post('/:id/interactions', authenticateProvider, async (req, res) => {
  try {
    const { type, description } = req.body;
    
    const validTypes = ['call', 'email', 'sms', 'meeting', 'quote_sent', 'follow_up'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid interaction type' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    lead.interactions.push({
      type,
      description,
      timestamp: new Date()
    });

    await lead.save();

    res.json({
      message: 'Interaction added successfully',
      interaction: lead.interactions[lead.interactions.length - 1]
    });
  } catch (error) {
    console.error('Error adding interaction:', error);
    res.status(500).json({
      error: 'Failed to add interaction',
      message: error.message
    });
  }
});

// Get lead statistics
router.get('/stats/overview', authenticateProvider, async (req, res) => {
  try {
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const scoreStats = await Lead.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $gte: ['$score', 8] }, 'hot',
              { $cond: [{ $gte: ['$score', 5] }, 'warm', 'cold'] }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalLeads = await Lead.countDocuments();
    const todayLeads = await Lead.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    res.json({
      totalLeads,
      todayLeads,
      statusBreakdown: stats,
      scoreBreakdown: scoreStats
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({
      error: 'Failed to fetch lead statistics',
      message: error.message
    });
  }
});

module.exports = router;