const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Lead = require('../models/Lead');
const { authenticateProvider, authenticateCustomer } = require('../middleware/auth');
const Joi = require('joi');

// Validation schema
const appointmentSchema = Joi.object({
  leadId: Joi.string().required(),
  scheduledDate: Joi.date().required(),
  duration: Joi.number().min(15).max(480).default(60),
  serviceType: Joi.string().required(),
  location: Joi.object({
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required()
  }).required(),
  notes: Joi.string().allow(''),
  estimatedCost: Joi.number().min(0).optional()
});

// Create appointment (Provider only)
router.post('/', authenticateProvider, async (req, res) => {
  try {
    const { error, value } = appointmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    // Check if lead exists
    const lead = await Lead.findById(value.leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const appointment = new Appointment({
      ...value,
      lead: value.leadId,
      provider: req.provider.id
    });

    await appointment.save();

    // Update lead status and mark appointment as booked
    lead.status = 'qualified';
    lead.appointmentBooked = true;
    lead.assignedTo = req.provider.id;
    await lead.save();

    await appointment.populate(['lead', 'provider']);

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      error: 'Failed to create appointment',
      message: error.message
    });
  }
});

// Get appointments (Provider)
router.get('/', authenticateProvider, async (req, res) => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query;
    
    const filter = { provider: req.provider.id };
    if (status) filter.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduledDate = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(filter)
      .populate('lead', 'name email phone serviceType')
      .populate('provider', 'businessName ownerName')
      .sort({ scheduledDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(filter);

    res.json({
      appointments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      error: 'Failed to fetch appointments',
      message: error.message
    });
  }
});

// Get single appointment
router.get('/:id', authenticateProvider, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      provider: req.provider.id
    })
    .populate('lead', 'name email phone serviceType message')
    .populate('provider', 'businessName ownerName phone email');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      error: 'Failed to fetch appointment',
      message: error.message
    });
  }
});

// Update appointment status
router.patch('/:id/status', authenticateProvider, async (req, res) => {
  try {
    const { status, completionNotes, actualCost } = req.body;
    
    const validStatuses = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      provider: req.provider.id
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.status = status;
    if (completionNotes) appointment.completionNotes = completionNotes;
    if (actualCost !== undefined) appointment.actualCost = actualCost;

    await appointment.save();

    // Update lead status based on appointment status
    const lead = await Lead.findById(appointment.lead);
    if (lead) {
      if (status === 'completed') {
        lead.status = 'converted';
      } else if (status === 'cancelled' || status === 'no_show') {
        lead.status = 'closed';
      }
      await lead.save();
    }

    res.json({
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      error: 'Failed to update appointment status',
      message: error.message
    });
  }
});

// Get available time slots
router.get('/slots/available', authenticateProvider, async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    // Get existing appointments for the date
    const existingAppointments = await Appointment.find({
      provider: req.provider.id,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled', 'no_show'] }
    });

    // Generate available slots (9 AM to 5 PM, 1-hour intervals)
    const availableSlots = [];
    const workingHours = [9, 10, 11, 12, 13, 14, 15, 16]; // 9 AM to 4 PM (last slot)

    workingHours.forEach(hour => {
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hour, 0, 0, 0);
      
      // Check if slot is already booked
      const isBooked = existingAppointments.some(apt => {
        const aptTime = new Date(apt.scheduledDate);
        return aptTime.getHours() === hour;
      });

      if (!isBooked) {
        availableSlots.push({
          time: slotTime.toISOString(),
          display: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
        });
      }
    });

    res.json({ availableSlots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      error: 'Failed to fetch available slots',
      message: error.message
    });
  }
});

module.exports = router;