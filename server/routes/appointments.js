const express = require('express');

module.exports = (Appointment) => {
  const router = express.Router();

  // Create a new appointment
  router.post('/', async (req, res) => {
    try {
      const appointment = new Appointment(req.body);
      await appointment.save();
      res.status(201).json(appointment);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get all appointments
  router.get('/', async (req, res) => {
    try {
      const appointments = await Appointment.find();
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get appointments by user email
  router.get('/user/:email', async (req, res) => {
    try {
      const appointments = await Appointment.find({ clientEmail: req.params.email });
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
