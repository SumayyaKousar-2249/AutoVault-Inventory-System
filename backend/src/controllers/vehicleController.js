'use strict';

const vehicleModel = require('../models/vehicleModel');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract and sanitise vehicle fields from a request body.
 */
function extractVehicleFields(body) {
  return {
    make:     (body.make     || '').trim(),
    model:    (body.model    || '').trim(),
    category: (body.category || '').trim(),
    price:    body.price,
    quantity: body.quantity,
  };
}

/**
 * Validate vehicle input fields (used by both add and update).
 * Expects pre-trimmed string values.
 * @returns {string|null} error message or null if valid
 */
function validateVehicleInput({ make, model, category, price, quantity }) {
  if (!make || !model || !category) {
    return 'make, model, and category are required.';
  }
  if (typeof price !== 'number' || price <= 0) {
    return 'price must be a positive number.';
  }
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0) {
    return 'quantity must be a non-negative integer.';
  }
  return null;
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/vehicles
 */
async function addVehicle(req, res) {
  try {
    const fields = extractVehicleFields(req.body);
    const error = validateVehicleInput(fields);
    if (error) return res.status(400).json({ error });

    const vehicle = await vehicleModel.create(fields);
    return res.status(201).json({ vehicle });
  } catch (err) {
    console.error('Add vehicle error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/vehicles
 */
async function getVehicles(req, res) {
  try {
    const vehicles = await vehicleModel.findAll();
    return res.status(200).json({ vehicles });
  } catch (err) {
    console.error('Get vehicles error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * GET /api/vehicles/search
 */
async function searchVehicles(req, res) {
  try {
    const { make, model, category, minPrice, maxPrice } = req.query;
    const vehicles = await vehicleModel.findByFilters({ make, model, category, minPrice, maxPrice });
    return res.status(200).json({ vehicles });
  } catch (err) {
    console.error('Search vehicles error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * PUT /api/vehicles/:id
 */
async function updateVehicle(req, res) {
  try {
    const id = Number(req.params.id);
    const fields = extractVehicleFields(req.body);

    const error = validateVehicleInput(fields);
    if (error) return res.status(400).json({ error });

    const existing = await vehicleModel.findById(id);
    if (!existing) return res.status(404).json({ error: 'Vehicle not found.' });

    const vehicle = await vehicleModel.update(id, fields);
    return res.status(200).json({ vehicle });
  } catch (err) {
    console.error('Update vehicle error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * DELETE /api/vehicles/:id
 */
async function deleteVehicle(req, res) {
  try {
    const id = Number(req.params.id);

    const existing = await vehicleModel.findById(id);
    if (!existing) return res.status(404).json({ error: 'Vehicle not found.' });

    await vehicleModel.remove(id);
    return res.status(200).json({ message: 'Vehicle deleted successfully.' });
  } catch (err) {
    console.error('Delete vehicle error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/vehicles/:id/purchase
 */
async function purchaseVehicle(req, res) {
  try {
    const id = Number(req.params.id);

    const existing = await vehicleModel.findById(id);
    if (!existing) return res.status(404).json({ error: 'Vehicle not found.' });

    if (existing.quantity === 0) {
      return res.status(400).json({ error: 'Vehicle is out of stock.' });
    }

    const changes = await vehicleModel.decrementQuantity(id);
    if (changes === 0) {
      // Race condition guard — stock hit zero between the check and the update
      return res.status(400).json({ error: 'Vehicle is out of stock.' });
    }

    const updated = await vehicleModel.findById(id);
    return res.status(200).json({ vehicle: updated });
  } catch (err) {
    console.error('Purchase vehicle error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * POST /api/vehicles/:id/restock  (ADMIN only)
 */
async function restockVehicle(req, res) {
  try {
    const id       = Number(req.params.id);
    const quantity = req.body.quantity;

    // Restock requires a positive integer (> 0, unlike add/update which allow 0)
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive integer.' });
    }

    const existing = await vehicleModel.findById(id);
    if (!existing) return res.status(404).json({ error: 'Vehicle not found.' });

    await vehicleModel.incrementQuantity(id, quantity);
    const updated = await vehicleModel.findById(id);
    return res.status(200).json({ vehicle: updated });
  } catch (err) {
    console.error('Restock vehicle error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  addVehicle,
  getVehicles,
  searchVehicles,
  updateVehicle,
  deleteVehicle,
  purchaseVehicle,
  restockVehicle,
  validateVehicleInput,
};
