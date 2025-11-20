const express = require('express');
const router = express.Router();

// Get all promos
router.get('/', async (req, res) => {
  try {
    const { Promo } = req.app.locals;
    const { status, active } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    // Filter only active promos (valid date range)
    if (active === 'true') {
      const now = new Date();
      query.validFrom = { $lte: now };
      query.validUntil = { $gte: now };
      query.status = 'active';
    }
    
    const promos = await Promo.find(query).sort({ createdAt: -1 });
    res.json(promos);
  } catch (error) {
    console.error('Error fetching promos:', error);
    res.status(500).json({ error: 'Failed to fetch promos', message: error.message });
  }
});

// Get promo by ID
router.get('/:id', async (req, res) => {
  try {
    const { Promo } = req.app.locals;
    const promo = await Promo.findById(req.params.id);
    
    if (!promo) {
      return res.status(404).json({ error: 'Promo not found' });
    }
    
    res.json(promo);
  } catch (error) {
    console.error('Error fetching promo:', error);
    res.status(500).json({ error: 'Failed to fetch promo', message: error.message });
  }
});

// Verify promo code
router.post('/verify', async (req, res) => {
  try {
    const { Promo } = req.app.locals;
    const { promoCode, bookingAmount } = req.body;
    
    if (!promoCode) {
      return res.status(400).json({ error: 'Promo code is required' });
    }
    
    const promo = await Promo.findOne({ 
      promoCode: promoCode.toUpperCase(),
      status: 'active'
    });
    
    if (!promo) {
      return res.status(404).json({ error: 'Invalid or expired promo code' });
    }
    
    const now = new Date();
    if (promo.validFrom > now || promo.validUntil < now) {
      return res.status(400).json({ error: 'Promo code is not valid at this time' });
    }
    
    if (promo.usageLimit && promo.timesUsed >= promo.usageLimit) {
      return res.status(400).json({ error: 'Promo code usage limit reached' });
    }
    
    if (bookingAmount && promo.minimumBookingAmount > bookingAmount) {
      return res.status(400).json({ 
        error: `Minimum booking amount of PHP ${promo.minimumBookingAmount} required` 
      });
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (promo.discountType === 'percentage') {
      discountAmount = (bookingAmount * promo.discountValue) / 100;
    } else {
      discountAmount = promo.discountValue;
    }
    
    res.json({
      valid: true,
      promo: {
        id: promo._id,
        title: promo.title,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discountAmount: discountAmount
      }
    });
  } catch (error) {
    console.error('Error verifying promo:', error);
    res.status(500).json({ error: 'Failed to verify promo', message: error.message });
  }
});

// Create new promo
router.post('/', async (req, res) => {
  try {
    const { Promo } = req.app.locals;
    const promoData = req.body;
    
    // Convert promo code to uppercase if provided
    if (promoData.promoCode) {
      promoData.promoCode = promoData.promoCode.toUpperCase();
    }
    
    const promo = new Promo(promoData);
    await promo.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Promo created successfully',
      promo 
    });
  } catch (error) {
    console.error('Error creating promo:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }
    res.status(500).json({ error: 'Failed to create promo', message: error.message });
  }
});

// Update promo
router.put('/:id', async (req, res) => {
  try {
    const { Promo } = req.app.locals;
    const promoData = req.body;
    
    // Convert promo code to uppercase if provided
    if (promoData.promoCode) {
      promoData.promoCode = promoData.promoCode.toUpperCase();
    }
    
    const promo = await Promo.findByIdAndUpdate(
      req.params.id,
      promoData,
      { new: true, runValidators: true }
    );
    
    if (!promo) {
      return res.status(404).json({ error: 'Promo not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Promo updated successfully',
      promo 
    });
  } catch (error) {
    console.error('Error updating promo:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }
    res.status(500).json({ error: 'Failed to update promo', message: error.message });
  }
});

// Delete promo
router.delete('/:id', async (req, res) => {
  try {
    const { Promo } = req.app.locals;
    const promo = await Promo.findByIdAndDelete(req.params.id);
    
    if (!promo) {
      return res.status(404).json({ error: 'Promo not found' });
    }
    
    res.json({ success: true, message: 'Promo deleted successfully' });
  } catch (error) {
    console.error('Error deleting promo:', error);
    res.status(500).json({ error: 'Failed to delete promo', message: error.message });
  }
});

// Apply promo (increment usage count)
router.post('/:id/apply', async (req, res) => {
  try {
    const { Promo } = req.app.locals;
    const promo = await Promo.findById(req.params.id);
    
    if (!promo) {
      return res.status(404).json({ error: 'Promo not found' });
    }
    
    if (promo.usageLimit && promo.timesUsed >= promo.usageLimit) {
      return res.status(400).json({ error: 'Promo usage limit reached' });
    }
    
    promo.timesUsed += 1;
    await promo.save();
    
    res.json({ 
      success: true, 
      message: 'Promo applied successfully',
      timesUsed: promo.timesUsed 
    });
  } catch (error) {
    console.error('Error applying promo:', error);
    res.status(500).json({ error: 'Failed to apply promo', message: error.message });
  }
});

module.exports = router;
