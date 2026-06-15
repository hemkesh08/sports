const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: "ok",
    project: "sports-event-sponsorship-&-kit"
  });
});

// Helper for validating items
function validateItems(items) {
  let calculatedCost = 0;
  for (const item of items) {
    if (!item.name || item.qty <= 0 || item.unitCost < 0) {
      return { valid: false, message: "Item quantity must be greater than 0, and cost must be non-negative." };
    }
    calculatedCost += item.qty * item.unitCost;
  }
  return { valid: true, cost: calculatedCost };
}

// 1. POST /api/sports_event_sponsorship_kit_donati
app.post('/api/sports_event_sponsorship_kit_donati', (req, res) => {
  const {
    event_name,
    event_date,
    category,
    budget_limit,
    items_donated,
    brand_visibility_received,
    status,
    notes
  } = req.body;

  if (!event_name || !event_date || !category || budget_limit === undefined || !items_donated || !brand_visibility_received) {
    return res.status(400).json({
      success: false,
      error: "MISSING_REQUIRED_FIELDS",
      message: "Validation Failed: All fields are required."
    });
  }

  let parsedItems = [];
  try {
    parsedItems = typeof items_donated === 'string' ? JSON.parse(items_donated) : items_donated;
  } catch (e) {
    return res.status(400).json({ success: false, error: "INVALID_JSON_ITEMS", message: "items_donated must be a valid JSON array." });
  }

  const itemCheck = validateItems(parsedItems);
  if (!itemCheck.valid) {
    return res.status(400).json({ success: false, error: "INVALID_ITEM_VALUES", message: itemCheck.message });
  }
  const calculatedCost = itemCheck.cost;

  if (calculatedCost > budget_limit) {
    return res.status(400).json({
      success: false,
      error: "BUDGET_OVERFLOW",
      message: "Validation Failed: Total item cost exceeds the approved budget limit.",
      details: { approved_budget_limit: budget_limit, calculated_total_cost: calculatedCost, exceeded_amount: calculatedCost - budget_limit }
    });
  }

  const itemsSerialized = JSON.stringify(parsedItems);
  const visibilitySerialized = typeof brand_visibility_received === 'string' ? brand_visibility_received : JSON.stringify(brand_visibility_received);

  const query = `
    INSERT INTO sports_event_sponsorship_kit_donation 
    (event_name, event_date, category, budget_limit, items_donated, brand_visibility_received, status, notes, total_cost)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [event_name, event_date, category, budget_limit, itemsSerialized, visibilitySerialized, status || 'Approved', notes || '', calculatedCost], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ success: false, error: "DB_INSERT_FAILED", message: err.message });
    }

    const newId = this.lastID;
    const auditQuery = `INSERT INTO audit_logs (sponsorship_id, items_donated, brand_visibility_received, status, changed_by) VALUES (?, ?, ?, ?, ?)`;
    db.run(auditQuery, [newId, itemsSerialized, visibilitySerialized, status || 'Approved', 'Staff']);

    res.status(201).json({
      success: true,
      id: newId,
      total_cost: calculatedCost,
      status: status || 'Approved',
      message: "Sponsorship record saved successfully."
    });
  });
});

// 2. GET /api/sports_event_sponsorship_kit_donati (With Pagination, Search, Filter)
app.get('/api/sports_event_sponsorship_kit_donati', (req, res) => {
  const statusFilter = req.query.status;
  const searchQuery = req.query.search;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  let query = `SELECT * FROM sports_event_sponsorship_kit_donation WHERE 1=1`;
  let countQuery = `SELECT COUNT(*) as count FROM sports_event_sponsorship_kit_donation WHERE 1=1`;
  const params = [];
  const countParams = [];

  // Filter tabs logic (All, Active, Completed, Archived)
  if (statusFilter && statusFilter !== 'All') {
    if (statusFilter === 'Active') {
      query += ` AND status IN ('Draft', 'Approved', 'Disbursed')`;
      countQuery += ` AND status IN ('Draft', 'Approved', 'Disbursed')`;
    } else if (statusFilter === 'Archived') {
      query += ` AND status = 'Archived'`;
      countQuery += ` AND status = 'Archived'`;
    } else if (statusFilter === 'Completed') {
      query += ` AND status = 'Completed'`;
      countQuery += ` AND status = 'Completed'`;
    } else {
      query += ` AND status = ?`;
      countQuery += ` AND status = ?`;
      params.push(statusFilter);
      countParams.push(statusFilter);
    }
  }

  if (searchQuery) {
    const wildCardSearch = `%${searchQuery}%`;
    query += ` AND (event_name LIKE ? OR items_donated LIKE ? OR notes LIKE ?)`;
    countQuery += ` AND (event_name LIKE ? OR items_donated LIKE ? OR notes LIKE ?)`;
    params.push(wildCardSearch, wildCardSearch, wildCardSearch);
    countParams.push(wildCardSearch, wildCardSearch, wildCardSearch);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  db.get(countQuery, countParams, (countErr, countResult) => {
    if (countErr) {
      console.error(countErr.message);
      return res.status(500).json({ success: false, message: "Error calculating page count." });
    }

    const totalCount = countResult.count;
    const totalPages = Math.ceil(totalCount / limit);

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: "Failed to retrieve records." });
      }

      const formattedRows = rows.map(row => ({
        ...row,
        items_donated: JSON.parse(row.items_donated),
        brand_visibility_received: JSON.parse(row.brand_visibility_received)
      }));

      res.status(200).json({
        success: true,
        data: formattedRows,
        pagination: { totalCount, totalPages, page, limit }
      });
    });
  });
});

// 3. GET /api/sports_event_sponsorship_kit_donati/:id
app.get('/api/sports_event_sponsorship_kit_donati/:id', (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM sports_event_sponsorship_kit_donation WHERE id = ?`;

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ success: false, message: "Error retrieving record details." });
    }

    if (!row) {
      return res.status(404).json({ success: false, error: "RECORD_NOT_FOUND", message: `Sponsorship record with ID ${id} was not found.` });
    }

    res.status(200).json({
      success: true,
      data: {
        ...row,
        items_donated: JSON.parse(row.items_donated),
        brand_visibility_received: JSON.parse(row.brand_visibility_received)
      }
    });
  });
});

// 4. PUT /api/sports_event_sponsorship_kit_donati/:id
app.put('/api/sports_event_sponsorship_kit_donati/:id', (req, res) => {
  const { id } = req.params;
  const {
    event_name,
    event_date,
    category,
    budget_limit,
    items_donated,
    brand_visibility_received,
    status,
    notes
  } = req.body;

  if (!event_name || !event_date || !category || budget_limit === undefined || !items_donated || !brand_visibility_received) {
    return res.status(400).json({ success: false, error: "MISSING_REQUIRED_FIELDS", message: "Validation Failed: All fields are required." });
  }

  let parsedItems = typeof items_donated === 'string' ? JSON.parse(items_donated) : items_donated;
  const itemCheck = validateItems(parsedItems);
  if (!itemCheck.valid) {
    return res.status(400).json({ success: false, error: "INVALID_ITEM_VALUES", message: itemCheck.message });
  }
  const calculatedCost = itemCheck.cost;

  if (calculatedCost > budget_limit) {
    return res.status(400).json({
      success: false,
      error: "BUDGET_OVERFLOW",
      message: "Validation Failed: Updated items exceed approved budget limits.",
      details: { approved_budget_limit: budget_limit, calculated_total_cost: calculatedCost, exceeded_amount: calculatedCost - budget_limit }
    });
  }

  const itemsSerialized = JSON.stringify(parsedItems);
  const visibilitySerialized = typeof brand_visibility_received === 'string' ? brand_visibility_received : JSON.stringify(brand_visibility_received);

  // Check if record exists
  db.get(`SELECT status FROM sports_event_sponsorship_kit_donation WHERE id = ?`, [id], (checkErr, row) => {
    if (checkErr || !row) {
      return res.status(404).json({ success: false, error: "RECORD_NOT_FOUND", message: "Record to update not found." });
    }

    const oldStatus = row.status;
    const query = `
      UPDATE sports_event_sponsorship_kit_donation
      SET event_name = ?, event_date = ?, category = ?, budget_limit = ?, items_donated = ?, brand_visibility_received = ?, status = ?, notes = ?, total_cost = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.run(query, [event_name, event_date, category, budget_limit, itemsSerialized, visibilitySerialized, status || oldStatus, notes || '', calculatedCost, id], function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }

      // Record Audit
      db.run(`INSERT INTO audit_logs (sponsorship_id, items_donated, brand_visibility_received, status, changed_by) VALUES (?, ?, ?, ?, ?)`,
        [id, itemsSerialized, visibilitySerialized, status || oldStatus, 'Staff']
      );

      res.status(200).json({ success: true, message: "Sponsorship record updated successfully." });
    });
  });
});

// 5. PATCH /api/sports_event_sponsorship_kit_donati/:id/status (Status only transitions)
app.patch('/api/sports_event_sponsorship_kit_donati/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: "Status parameter is required." });
  }

  db.get(`SELECT * FROM sports_event_sponsorship_kit_donation WHERE id = ?`, [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ success: false, error: "RECORD_NOT_FOUND", message: "Record not found." });
    }

    const query = `UPDATE sports_event_sponsorship_kit_donation SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(query, [status, id], function (updateErr) {
      if (updateErr) {
        return res.status(500).json({ success: false, message: "Failed to transition status." });
      }

      // Log status transition audit trail
      db.run(`INSERT INTO audit_logs (sponsorship_id, items_donated, brand_visibility_received, status, changed_by) VALUES (?, ?, ?, ?, ?)`,
        [id, row.items_donated, row.brand_visibility_received, status, 'Manager']
      );

      res.status(200).json({ success: true, message: `Status transitioned successfully to ${status}.` });
    });
  });
});

// 6. GET /api/audit_logs (Audit trailing retrieves)
app.get('/api/audit_logs', (req, res) => {
  const sponsorshipId = req.query.sponsorship_id;
  let query = `SELECT * FROM audit_logs`;
  const params = [];

  if (sponsorshipId) {
    query += ` WHERE sponsorship_id = ?`;
    params.push(sponsorshipId);
  }
  query += ` ORDER BY created_at DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to fetch audit trails." });
    }
    const formattedRows = rows.map(r => ({
      ...r,
      items_donated: JSON.parse(r.items_donated),
      brand_visibility_received: JSON.parse(r.brand_visibility_received)
    }));
    res.status(200).json({ success: true, data: formattedRows });
  });
});

// 7. POST /api/audit_logs (Manual manual audit write logs)
app.post('/api/audit_logs', (req, res) => {
  const { sponsorship_id, status, notes, changed_by } = req.body;
  if (!sponsorship_id || !status) {
    return res.status(400).json({ success: false, message: "Sponsorship ID and Status parameters required." });
  }

  db.get(`SELECT * FROM sports_event_sponsorship_kit_donation WHERE id = ?`, [sponsorship_id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ success: false, message: "Reference sponsorship record missing." });
    }

    const query = `INSERT INTO audit_logs (sponsorship_id, items_donated, brand_visibility_received, status, changed_by) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [sponsorship_id, row.items_donated, row.brand_visibility_received, status, changed_by || 'Staff'], function (insErr) {
      if (insErr) {
        return res.status(500).json({ success: false, message: "Failed logging manual audit transaction." });
      }
      res.status(201).json({ success: true, message: "Manual audit trail written successfully." });
    });
  });
});

// 8. GET /api/sports_event_sponsorship_kit_donati/:id/engine_analysis (Core Logic Processing Engine)
app.get('/api/sports_event_sponsorship_kit_donati/:id/engine_analysis', (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM sports_event_sponsorship_kit_donation WHERE id = ?`;
  db.get(query, [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ success: false, error: "RECORD_NOT_FOUND", message: `Sponsorship ID ${id} not found.` });
    }

    const items = JSON.parse(row.items_donated);
    const visibility = JSON.parse(row.brand_visibility_received);
    const totalCost = row.total_cost;
    const budgetLimit = row.budget_limit;
    const budgetUtilization = budgetLimit > 0 ? parseFloat(((totalCost / budgetLimit) * 100).toFixed(2)) : 0.0;
    const securedAssetsList = Object.entries(visibility).filter(([_, val]) => val === true).map(([key, _]) => key);
    const visibilityCount = securedAssetsList.length;
    const exposureFactor = visibilityCount * 25;
    const savingsFactor = Math.max(0, 100 - budgetUtilization);
    const roiScore = parseFloat(((exposureFactor * 0.6) + (savingsFactor * 0.4)).toFixed(2));

    let trendIndicator = "Normal Efficiency";
    let trendClass = "normal";
    
    if (budgetUtilization > 95.0 && visibilityCount <= 1) {
      trendIndicator = "WARNING: Critical Budget Override - Low Brand Exposure";
      trendClass = "danger";
    } else if (budgetUtilization <= 70.0 && visibilityCount >= 2) {
      trendIndicator = "OPTIMAL: Outstanding Budget Efficiency & High Exposure";
      trendClass = "success";
    } else if (budgetUtilization > 90.0) {
      trendIndicator = "NOTICE: High Budget Utilization";
      trendClass = "warning";
    } else if (visibilityCount === 0) {
      trendIndicator = "WARNING: Zero Brand Visibility Logged";
      trendClass = "danger";
    }

    res.status(200).json({
      success: true,
      analysis: {
        sponsorship_id: row.id,
        event_name: row.event_name,
        category: row.category,
        budget_limit: budgetLimit,
        total_cost: totalCost,
        budget_utilization_pct: budgetUtilization,
        visibility_assets_count: visibilityCount,
        visibility_assets_list: securedAssetsList,
        roi_score_index: roiScore,
        trend_indicator: trendIndicator,
        trend_class: trendClass,
        last_updated: row.updated_at
      }
    });
  });
});

// Serve frontend static production-built files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Serve React single-page app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
