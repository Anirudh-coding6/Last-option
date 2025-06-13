const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Appointment = require('../models/Appointment');
const { authenticateProvider } = require('../middleware/auth');

// Get dashboard analytics
router.get('/dashboard', authenticateProvider, async (req, res) => {
  try {
    const providerId = req.provider.id;
    
    // Lead statistics
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'pending' });
    const convertedLeads = await Lead.countDocuments({ status: 'converted' });
    
    // Today's leads
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLeads = await Lead.countDocuments({
      createdAt: { $gte: today }
    });

    // Appointment statistics
    const totalAppointments = await Appointment.countDocuments({ provider: providerId });
    const activeAppointments = await Appointment.countDocuments({
      provider: providerId,
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
    });

    // Monthly revenue (simulated based on completed appointments)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const completedAppointments = await Appointment.find({
      provider: providerId,
      status: 'completed',
      scheduledDate: { $gte: thisMonth },
      actualCost: { $exists: true }
    });

    const monthlyRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.actualCost || 0), 0);

    // Lead score distribution
    const leads = await Lead.find({});
    const scoreDistribution = { hot: 0, warm: 0, cold: 0 };
    
    leads.forEach(lead => {
      lead.calculateScore();
      const category = lead.getScoreCategory();
      scoreDistribution[category]++;
    });

    // Leads by service type
    const leadsByService = await Lead.aggregate([
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Conversion rate
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    res.json({
      overview: {
        totalLeads,
        newLeads,
        todayLeads,
        convertedLeads,
        conversionRate: parseFloat(conversionRate),
        totalAppointments,
        activeAppointments,
        monthlyRevenue
      },
      scoreDistribution,
      leadsByService,
      rating: 4.8 // Simulated rating
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
});

// Get leads analytics
router.get('/leads', authenticateProvider, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Leads over time
    const leadsOverTime = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Status breakdown
    const statusBreakdown = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Source breakdown
    const sourceBreakdown = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      leadsOverTime,
      statusBreakdown,
      sourceBreakdown
    });
  } catch (error) {
    console.error('Error fetching leads analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch leads analytics',
      message: error.message
    });
  }
});

module.exports = router;