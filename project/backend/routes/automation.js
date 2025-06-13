const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { authenticateProvider } = require('../middleware/auth');

// Trigger lead scoring automation
router.post('/score-leads', authenticateProvider, async (req, res) => {
  try {
    const leads = await Lead.find({ status: { $ne: 'closed' } });
    
    let updatedCount = 0;
    for (const lead of leads) {
      const oldScore = lead.score;
      lead.calculateScore();
      
      if (lead.score !== oldScore) {
        await lead.save();
        updatedCount++;
      }
    }

    res.json({
      message: 'Lead scoring automation completed',
      totalLeads: leads.length,
      updatedLeads: updatedCount
    });
  } catch (error) {
    console.error('Error in lead scoring automation:', error);
    res.status(500).json({
      error: 'Lead scoring automation failed',
      message: error.message
    });
  }
});

// Get automation insights
router.get('/insights', authenticateProvider, async (req, res) => {
  try {
    // High-value leads that need immediate attention
    const hotLeads = await Lead.find({})
      .then(leads => leads.filter(lead => {
        lead.calculateScore();
        return lead.getScoreCategory() === 'hot' && lead.status === 'pending';
      }));

    // Leads that haven't been contacted in 24 hours
    const staleLeads = await Lead.find({
      status: 'pending',
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    // Leads ready for follow-up
    const followUpLeads = await Lead.find({
      status: 'contacted',
      followUpDate: { $lte: new Date() }
    });

    res.json({
      hotLeads: hotLeads.length,
      staleLeads: staleLeads.length,
      followUpLeads: followUpLeads.length,
      recommendations: [
        ...(hotLeads.length > 0 ? [`You have ${hotLeads.length} hot leads that need immediate attention`] : []),
        ...(staleLeads.length > 0 ? [`${staleLeads.length} leads haven't been contacted in 24+ hours`] : []),
        ...(followUpLeads.length > 0 ? [`${followUpLeads.length} leads are ready for follow-up`] : [])
      ]
    });
  } catch (error) {
    console.error('Error fetching automation insights:', error);
    res.status(500).json({
      error: 'Failed to fetch automation insights',
      message: error.message
    });
  }
});

module.exports = router;