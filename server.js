const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Express json parser with built-in error handling for malformed JSON
app.use(express.json({
  limit: '1mb', // limit payload size to prevent extra-large payloads from crashing
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('Invalid JSON payload');
    }
  }
}));

// Global error handler for JSON parsing issues
app.use((err, req, res, next) => {
  if (err && err.message === 'Invalid JSON payload') {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload: Parsing failed.",
      code: 400
    });
  }
  next(err);
});

// Sanitisation helper
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  // Remove HTML tags
  let sanitized = str.replace(/<[^>]*>/g, '');
  // Remove dangerous special characters, but preserve letters, numbers, spaces, and basic punctuation
  sanitized = sanitized.replace(/[<>'"`;\$&\\\{\}]/g, '');
  return sanitized.trim();
}

// Input Sanitisation Middleware
app.use((req, res, next) => {
  try {
    if (req.body) {
      if (req.body.event_name) req.body.event_name = sanitizeString(req.body.event_name);
      if (req.body.category) req.body.category = sanitizeString(req.body.category);
      if (req.body.status) req.body.status = sanitizeString(req.body.status);
      if (req.body.notes) req.body.notes = sanitizeString(req.body.notes);
      if (req.body.changed_by) req.body.changed_by = sanitizeString(req.body.changed_by);
      
      if (req.body.items_donated) {
        let items = req.body.items_donated;
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch (e) {
            // Keep original, validation step will fail it cleanly
          }
        }
        if (Array.isArray(items)) {
          req.body.items_donated = items.map(item => ({
            name: sanitizeString(item.name || ''),
            qty: parseInt(item.qty) || 0,
            unitCost: parseFloat(item.unitCost) || 0.0
          }));
        }
      }
    }

    if (req.query) {
      if (req.query.search) req.query.search = sanitizeString(req.query.search);
      if (req.query.status) req.query.status = sanitizeString(req.query.status);
      if (req.query.startDate) req.query.startDate = sanitizeString(req.query.startDate);
      if (req.query.endDate) req.query.endDate = sanitizeString(req.query.endDate);
    }
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal Input Sanitisation Error: " + err.message,
      code: 500
    });
  }
});

// Helper for validating items
function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, message: "Items list must be a non-empty array." };
  }
  let calculatedCost = 0;
  for (const item of items) {
    if (!item.name || item.name.trim() === '') {
      return { valid: false, message: "Item name cannot be empty." };
    }
    if (item.qty <= 0) {
      return { valid: false, message: "Item quantity must be greater than 0." };
    }
    if (item.unitCost < 0) {
      return { valid: false, message: "Item unit cost must be non-negative." };
    }
    calculatedCost += item.qty * item.unitCost;
  }
  return { valid: true, cost: calculatedCost };
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  try {
    res.status(200).json({
      status: "ok",
      project: "sports-event-sponsorship-&-kit"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, code: 500 });
  }
});

// 1. POST /api/sports_event_sponsorship_kit_donati
app.post('/api/sports_event_sponsorship_kit_donati', (req, res) => {
  try {
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
        message: "Validation Failed: All required fields (event_name, event_date, category, budget_limit, items_donated, brand_visibility_received) must be provided.",
        code: 400
      });
    }

    let parsedItems = items_donated;
    if (typeof items_donated === 'string') {
      try {
        parsedItems = JSON.parse(items_donated);
      } catch (e) {
        return res.status(400).json({ success: false, message: "items_donated must be a valid JSON array.", code: 400 });
      }
    }

    const itemCheck = validateItems(parsedItems);
    if (!itemCheck.valid) {
      return res.status(400).json({ success: false, message: itemCheck.message, code: 400 });
    }
    const calculatedCost = itemCheck.cost;

    if (calculatedCost > budget_limit) {
      return res.status(400).json({
        success: false,
        message: `Validation Failed: Total item cost (₹${calculatedCost}) exceeds the approved budget limit (₹${budget_limit}).`,
        code: 400
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
        return res.status(500).json({ success: false, message: "Database Write Error: " + err.message, code: 500 });
      }

      const newId = this.lastID;
      const auditQuery = `INSERT INTO audit_logs (sponsorship_id, items_donated, brand_visibility_received, status, changed_by) VALUES (?, ?, ?, ?, ?)`;
      db.run(auditQuery, [newId, itemsSerialized, visibilitySerialized, status || 'Approved', 'Staff'], (auditErr) => {
        if (auditErr) {
          // Log audit failure but do not crash response
          console.error("Audit log failed:", auditErr.message);
        }
      });

      res.status(201).json({
        success: true,
        id: newId,
        total_cost: calculatedCost,
        status: status || 'Approved',
        message: "Sponsorship record saved successfully."
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error: " + err.message, code: 500 });
  }
});

// 2. GET /api/sports_event_sponsorship_kit_donati
app.get('/api/sports_event_sponsorship_kit_donati', (req, res) => {
  try {
    const statusFilter = req.query.status;
    const searchQuery = req.query.search;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM sports_event_sponsorship_kit_donation WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) as count FROM sports_event_sponsorship_kit_donation WHERE 1=1`;
    const params = [];
    const countParams = [];

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
        return res.status(500).json({ success: false, message: "Database Query Error (Count): " + countErr.message, code: 500 });
      }

      const totalCount = countResult ? countResult.count : 0;
      const totalPages = Math.ceil(totalCount / limit);

      db.all(query, params, (err, rows) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Database Query Error (Rows): " + err.message, code: 500 });
        }

        const formattedRows = rows.map(row => {
          let items = [];
          let visibility = {};
          try { items = JSON.parse(row.items_donated); } catch(e) {}
          try { visibility = JSON.parse(row.brand_visibility_received); } catch(e) {}
          return {
            ...row,
            items_donated: items,
            brand_visibility_received: visibility
          };
        });

        res.status(200).json({
          success: true,
          data: formattedRows,
          pagination: { totalCount, totalPages, page, limit }
        });
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error: " + err.message, code: 500 });
  }
});

// 3. GET /api/sports_event_sponsorship_kit_donati/:id
app.get('/api/sports_event_sponsorship_kit_donati/:id', (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT * FROM sports_event_sponsorship_kit_donation WHERE id = ?`;

    db.get(query, [id], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Database Query Error: " + err.message, code: 500 });
      }

      if (!row) {
        return res.status(404).json({ success: false, message: `Sponsorship record with ID ${id} was not found.`, code: 404 });
      }

      let items = [];
      let visibility = {};
      try { items = JSON.parse(row.items_donated); } catch(e) {}
      try { visibility = JSON.parse(row.brand_visibility_received); } catch(e) {}

      res.status(200).json({
        success: true,
        data: {
          ...row,
          items_donated: items,
          brand_visibility_received: visibility
        }
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error: " + err.message, code: 500 });
  }
});

// 4. PUT /api/sports_event_sponsorship_kit_donati/:id
app.put('/api/sports_event_sponsorship_kit_donati/:id', (req, res) => {
  try {
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
      return res.status(400).json({ success: false, message: "Validation Failed: All required fields must be provided.", code: 400 });
    }

    let parsedItems = items_donated;
    if (typeof items_donated === 'string') {
      try {
        parsedItems = JSON.parse(items_donated);
      } catch (e) {
        return res.status(400).json({ success: false, message: "items_donated must be a valid JSON array.", code: 400 });
      }
    }

    const itemCheck = validateItems(parsedItems);
    if (!itemCheck.valid) {
      return res.status(400).json({ success: false, message: itemCheck.message, code: 400 });
    }
    const calculatedCost = itemCheck.cost;

    if (calculatedCost > budget_limit) {
      return res.status(400).json({
        success: false,
        message: `Validation Failed: Updated item cost (₹${calculatedCost}) exceeds approved budget limit (₹${budget_limit}).`,
        code: 400
      });
    }

    const itemsSerialized = JSON.stringify(parsedItems);
    const visibilitySerialized = typeof brand_visibility_received === 'string' ? brand_visibility_received : JSON.stringify(brand_visibility_received);

    db.get(`SELECT status FROM sports_event_sponsorship_kit_donation WHERE id = ?`, [id], (checkErr, row) => {
      if (checkErr) {
        return res.status(500).json({ success: false, message: "Database Query Error: " + checkErr.message, code: 500 });
      }
      if (!row) {
        return res.status(404).json({ success: false, message: "Record to update not found.", code: 404 });
      }

      const oldStatus = row.status;
      const query = `
        UPDATE sports_event_sponsorship_kit_donation
        SET event_name = ?, event_date = ?, category = ?, budget_limit = ?, items_donated = ?, brand_visibility_received = ?, status = ?, notes = ?, total_cost = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.run(query, [event_name, event_date, category, budget_limit, itemsSerialized, visibilitySerialized, status || oldStatus, notes || '', calculatedCost, id], function (err) {
        if (err) {
          return res.status(500).json({ success: false, message: "Database Update Error: " + err.message, code: 500 });
        }

        db.run(`INSERT INTO audit_logs (sponsorship_id, items_donated, brand_visibility_received, status, changed_by) VALUES (?, ?, ?, ?, ?)`,
          [id, itemsSerialized, visibilitySerialized, status || oldStatus, 'Staff']
        );

        res.status(200).json({ success: true, message: "Sponsorship record updated successfully." });
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error: " + err.message, code: 500 });
  }
});

// 5. PATCH /api/sports_event_sponsorship_kit_donati/:id/status
app.patch('/api/sports_event_sponsorship_kit_donati/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status parameter is required.", code: 400 });
    }

    db.get(`SELECT * FROM sports_event_sponsorship_kit_donation WHERE id = ?`, [id], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Database Query Error: " + err.message, code: 500 });
      }
      if (!row) {
        return res.status(404).json({ success: false, message: "Record not found.", code: 404 });
      }

      const query = `UPDATE sports_event_sponsorship_kit_donation SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      db.run(query, [status, id], function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ success: false, message: "Failed to transition status: " + updateErr.message, code: 500 });
        }

        db.run(`INSERT INTO audit_logs (sponsorship_id, items_donated, brand_visibility_received, status, changed_by) VALUES (?, ?, ?, ?, ?)`,
          [id, row.items_donated, row.brand_visibility_received, status, 'Manager']
        );

        res.status(200).json({ success: true, message: `Status transitioned successfully to ${status}.` });
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error: " + err.message, code: 500 });
  }
});

// 6. GET /api/audit_logs
app.get('/api/audit_logs', (req, res) => {
  try {
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
        return res.status(500).json({ success: false, message: "Failed to fetch audit trails: " + err.message, code: 500 });
      }
      const formattedRows = rows.map(r => {
        let items = [];
        let visibility = {};
        try { items = JSON.parse(r.items_donated || "[]"); } catch(e) {}
        try { visibility = JSON.parse(r.brand_visibility_received || "{}"); } catch(e) {}
        return {
          ...r,
          items_donated: items,
          brand_visibility_received: visibility
        };
      });
      res.status(200).json({ success: true, data: formattedRows });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error: " + err.message, code: 500 });
  }
});

// 7. POST /api/audit_logs
app.post('/api/audit_logs', (req, res) => {
  try {
    const { sponsorship_id, status, changed_by } = req.body;
    if (!sponsorship_id || !status) {
      return res.status(400).json({ success: false, message: "Sponsorship ID and Status parameters required.", code: 400 });
    }

    db.get(`SELECT * FROM sports_event_sponsorship_kit_donation WHERE id = ?`, [sponsorship_id], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Database Query Error: " + err.message, code: 500 });
      }
      if (!row) {
        return res.status(404).json({ success: false, message: "Reference sponsorship record missing.", code: 404 });
      }

      const query = `INSERT INTO audit_logs (sponsorship_id, items_donated, brand_visibility_received, status, changed_by) VALUES (?, ?, ?, ?, ?)`;
      db.run(query, [sponsorship_id, row.items_donated, row.brand_visibility_received, status, changed_by || 'Staff'], function (insErr) {
        if (insErr) {
          return res.status(500).json({ success: false, message: "Failed logging manual audit transaction: " + insErr.message, code: 500 });
        }
        res.status(201).json({ success: true, message: "Manual audit trail written successfully." });
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error: " + err.message, code: 500 });
  }
});

// 8. GET /api/sports_event_sponsorship_kit_donati/:id/engine_analysis
app.get('/api/sports_event_sponsorship_kit_donati/:id/engine_analysis', (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT * FROM sports_event_sponsorship_kit_donation WHERE id = ?`;
    db.get(query, [id], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Database Query Error: " + err.message, code: 500 });
      }
      if (!row) {
        return res.status(404).json({ success: false, message: `Sponsorship ID ${id} not found.`, code: 404 });
      }

      let items = [];
      let visibility = {};
      try { items = JSON.parse(row.items_donated); } catch(e) {}
      try { visibility = JSON.parse(row.brand_visibility_received); } catch(e) {}

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
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error: " + err.message, code: 500 });
  }
});

// 9. GET /api/reports/summary
app.get('/api/reports/summary', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = `SELECT * FROM sports_event_sponsorship_kit_donation WHERE 1=1`;
    const params = [];

    if (startDate) {
      query += ` AND event_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND event_date <= ?`;
      params.push(endDate);
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Database Query Error: " + err.message, code: 500 });
      }

      let totalSpend = 0;
      let totalBudget = 0;
      const categoryCounts = { School: 0, Tournament: 0, Academy: 0, Club: 0 };
      const categorySpends = { School: 0, Tournament: 0, Academy: 0, Club: 0 };
      const statusCounts = { Draft: 0, Approved: 0, Disbursed: 0, Completed: 0, Archived: 0 };

      rows.forEach(row => {
        totalSpend += row.total_cost;
        totalBudget += row.budget_limit;
        if (categoryCounts[row.category] !== undefined) {
          categoryCounts[row.category]++;
          categorySpends[row.category] += row.total_cost;
        }
        if (statusCounts[row.status] !== undefined) {
          statusCounts[row.status]++;
        }
      });

      const averageBudgetUtilization = totalBudget > 0 ? parseFloat(((totalSpend / totalBudget) * 100).toFixed(2)) : 0;

      // Compile last 30 days time series data (by date)
      const timeSeriesMap = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        timeSeriesMap[dateString] = { date: dateString, cost: 0, count: 0 };
      }

      rows.forEach(row => {
        const datePart = row.created_at ? row.created_at.split(' ')[0] : row.event_date;
        if (timeSeriesMap[datePart]) {
          timeSeriesMap[datePart].cost += row.total_cost;
          timeSeriesMap[datePart].count++;
        }
      });

      const timeSeries = Object.values(timeSeriesMap).sort((a, b) => a.date.localeCompare(b.date));

      res.status(200).json({
        success: true,
        summary: {
          totalRecords: rows.length,
          totalSpend,
          totalBudget,
          averageBudgetUtilization,
          categoryCounts,
          categorySpends,
          statusCounts,
          timeSeries
        }
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error: " + err.message, code: 500 });
  }
});

// 10. GET /api/sports_event_sponsorship_kit_donati/export
app.get('/api/sports_event_sponsorship_kit_donati/export', (req, res) => {
  try {
    const query = `SELECT * FROM sports_event_sponsorship_kit_donation ORDER BY created_at DESC`;
    db.all(query, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed database export: " + err.message, code: 500 });
      }

      let csvContent = "ID,Recipient Event/School,Date,Category,Budget Limit (INR),Total Cost (INR),Status,Notes,Created At\n";
      rows.forEach(row => {
        const nameEscaped = `"${row.event_name.replace(/"/g, '""')}"`;
        const notesEscaped = `"${(row.notes || '').replace(/"/g, '""')}"`;
        csvContent += `${row.id},${nameEscaped},${row.event_date},${row.category},${row.budget_limit},${row.total_cost},${row.status},${notesEscaped},${row.created_at}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sports_sponsorships_export.csv');
      res.status(200).send(csvContent);
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error: " + err.message, code: 500 });
  }
});

// 11. GET /api/dashboard/summary
app.get('/api/dashboard/summary', (req, res) => {
  try {
    const query = `SELECT * FROM sports_event_sponsorship_kit_donation`;
    db.all(query, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed fetching dashboard stats: " + err.message, code: 500 });
      }

      let totalSpend = 0;
      let activeCount = 0;
      let completedCount = 0;
      let warningAlertsCount = 0;

      rows.forEach(row => {
        totalSpend += row.total_cost;
        if (['Draft', 'Approved', 'Disbursed'].includes(row.status)) {
          activeCount++;
        }
        if (row.status === 'Completed') {
          completedCount++;
        }

        const budgetLimit = row.budget_limit;
        const totalCost = row.total_cost;
        const budgetUtilization = budgetLimit > 0 ? (totalCost / budgetLimit) * 100 : 0;
        
        let visibilityCount = 0;
        try {
          const visibility = JSON.parse(row.brand_visibility_received);
          visibilityCount = Object.values(visibility).filter(v => v === true).length;
        } catch (e) {}

        if (budgetUtilization > 90.0 || visibilityCount === 0) {
          warningAlertsCount++;
        }
      });

      res.status(200).json({
        success: true,
        summary: {
          totalSpend,
          activeCount,
          completedCount,
          warningAlertsCount,
          totalRecords: rows.length
        }
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error: " + err.message, code: 500 });
  }
});

// 12. GET /api/sports_event_sponsorship_kit_donati/:id/detail
app.get('/api/sports_event_sponsorship_kit_donati/:id/detail', (req, res) => {
  try {
    const { id } = req.params;
    const sponsorshipQuery = `SELECT * FROM sports_event_sponsorship_kit_donation WHERE id = ?`;

    db.get(sponsorshipQuery, [id], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Error retrieving sponsorship record: " + err.message, code: 500 });
      }
      if (!row) {
        return res.status(404).json({ success: false, message: `Sponsorship ID ${id} not found.`, code: 404 });
      }

      let parsedRow = { ...row };
      try { parsedRow.items_donated = JSON.parse(row.items_donated); } catch(e) { parsedRow.items_donated = []; }
      try { parsedRow.brand_visibility_received = JSON.parse(row.brand_visibility_received); } catch(e) { parsedRow.brand_visibility_received = {}; }

      const auditQuery = `SELECT * FROM audit_logs WHERE sponsorship_id = ? ORDER BY created_at DESC`;
      db.all(auditQuery, [id], (auditErr, auditRows) => {
        if (auditErr) {
          return res.status(500).json({ success: false, message: "Error retrieving related audit histories: " + auditErr.message, code: 500 });
        }

        const formattedAuditLogs = auditRows.map(r => {
          let items = [];
          let visibility = {};
          try { items = JSON.parse(r.items_donated || "[]"); } catch(e) {}
          try { visibility = JSON.parse(r.brand_visibility_received || "{}"); } catch(e) {}
          return {
            ...r,
            items_donated: items,
            brand_visibility_received: visibility
          };
        });

        res.status(200).json({
          success: true,
          data: {
            sponsorship: parsedRow,
            auditLogs: formattedAuditLogs
          }
        });
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error: " + err.message, code: 500 });
  }
});

// Serve frontend static production-built files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Serve React single-page app for any non-API routes
app.get('*', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  } catch (err) {
    res.status(500).json({ success: false, message: "Static file serving failed: " + err.message, code: 500 });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
