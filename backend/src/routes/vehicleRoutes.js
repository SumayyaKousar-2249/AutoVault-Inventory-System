'use strict';

const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// Authenticated users (JWT required)
router.get('/search',          authenticate,              vehicleController.searchVehicles);
router.post('/',               authenticate,              vehicleController.addVehicle);
router.get('/',                authenticate,              vehicleController.getVehicles);
router.put('/:id',             authenticate,              vehicleController.updateVehicle);
router.post('/:id/purchase',   authenticate,              vehicleController.purchaseVehicle);

// Admin-only (JWT + ADMIN role required)
router.delete('/:id',          authenticate, requireAdmin, vehicleController.deleteVehicle);
router.post('/:id/restock',    authenticate, requireAdmin, vehicleController.restockVehicle);

module.exports = router;
