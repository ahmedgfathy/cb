require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const HOST = "127.0.0.1";
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "client", "dist")));

// ─── Auth Middleware ───
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function superAdminOnly(req, res, next) {
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Super admin access required" });
  }
  next();
}

function companyAdminOrSuper(req, res, next) {
  if (req.user.role !== "super_admin" && req.user.role !== "company_admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ─── Initialize DB ───
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) UNIQUE NOT NULL,
        max_users INTEGER DEFAULT 5,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'employee',
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ─── Property Lookup Tables (Company-scoped) ───
    for (const tbl of ['property_statuses', 'property_types', 'finish_types', 'property_categories']) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${tbl} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          UNIQUE(name, company_id)
        );
      `);
    }

    // ─── Properties Master Table (FK-based, like leads) ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        property_number VARCHAR(50) DEFAULT '',
        area VARCHAR(255) DEFAULT '',
        unit_for_id INTEGER REFERENCES property_statuses(id) ON DELETE SET NULL,
        property_type_id INTEGER REFERENCES property_types(id) ON DELETE SET NULL,
        finish_type_id INTEGER REFERENCES finish_types(id) ON DELETE SET NULL,
        building VARCHAR(100) DEFAULT '',
        total_price NUMERIC(15,2) DEFAULT 0,
        space VARCHAR(100) DEFAULT '',
        unit_no VARCHAR(100) DEFAULT '',
        description TEXT DEFAULT '',
        property_offered_by VARCHAR(255) DEFAULT '',
        name VARCHAR(255) DEFAULT '',
        mobile VARCHAR(255) DEFAULT '',
        last_followup DATE,
        note_of_call TEXT DEFAULT '',
        new_feedback TEXT DEFAULT '',
        date_of_last_call DATE,
        rent_to VARCHAR(255) DEFAULT '',
        property_name_compound VARCHAR(255) DEFAULT '',
        handler_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        area_label VARCHAR(255) DEFAULT '',
        land_area VARCHAR(100) DEFAULT '',
        the_floors VARCHAR(255) DEFAULT '',
        category_id INTEGER REFERENCES property_categories(id) ON DELETE SET NULL,
        inside_outside VARCHAR(100) DEFAULT '',
        sales VARCHAR(255) DEFAULT '',
        last_modified_by VARCHAR(255) DEFAULT '',
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        type VARCHAR(50) DEFAULT 'buyer',
        notes TEXT DEFAULT '',
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
        property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
        stage VARCHAR(50) DEFAULT 'prospect',
        amount NUMERIC(12,2),
        probability INTEGER DEFAULT 0,
        expected_close DATE,
        notes TEXT DEFAULT '',
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'contract',
        property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
        notes TEXT DEFAULT '',
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ─── Lookup Tables (Company-scoped) ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS call_statuses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        UNIQUE(name, company_id)
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_statuses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        UNIQUE(name, company_id)
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS unit_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        UNIQUE(name, company_id)
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        UNIQUE(name, company_id)
      );
    `);

    // ─── Leads Master Table ───
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        lead_number VARCHAR(20) UNIQUE NOT NULL,
        salutation VARCHAR(20) DEFAULT '',
        last_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) DEFAULT '',
        call_status_id INTEGER REFERENCES call_statuses(id) ON DELETE SET NULL,
        client_status_id INTEGER REFERENCES client_statuses(id) ON DELETE SET NULL,
        unit_type_id INTEGER REFERENCES unit_types(id) ON DELETE SET NULL,
        activity_type_id INTEGER REFERENCES activity_types(id) ON DELETE SET NULL,
        assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        last_followup DATE,
        feedback TEXT DEFAULT '',
        description TEXT DEFAULT '',
        last_modified_by VARCHAR(100) DEFAULT '',
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create super admin if not exists
    const saCheck = await pool.query("SELECT id FROM users WHERE role = 'super_admin'");
    if (saCheck.rows.length === 0) {
      const hash = await bcrypt.hash(process.env.SUPER_ADMIN_PASS, 10);
      await pool.query(
        "INSERT INTO users (name, mobile, password, role, status) VALUES ($1, $2, $3, 'super_admin', 'active')",
        ["Super Admin", process.env.SUPER_ADMIN_USER, hash]
      );
      console.log("Super admin created: xinreal / ZeroCall20!@H");
    }

    console.log("Database tables ready.");
  } catch (err) {
    console.error("Database init error:", err.message);
  }
}

// ═══════════════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════════════

// Register new company (creates pending request)
app.post("/api/auth/register", async (req, res) => {
  try {
    const { company_name, mobile, password, contact_name } = req.body;
    if (!company_name || !mobile || !password) {
      return res.status(400).json({ error: "Company name, mobile and password are required" });
    }
    const existing = await pool.query("SELECT id FROM companies WHERE mobile = $1", [mobile]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Mobile number already registered" });
    }
    const userExisting = await pool.query("SELECT id FROM users WHERE mobile = $1", [mobile]);
    if (userExisting.rows.length > 0) {
      return res.status(409).json({ error: "Mobile number already registered" });
    }
    const hash = await bcrypt.hash(password, 10);

    // Create company (pending)
    const company = await pool.query(
      "INSERT INTO companies (name, mobile, status) VALUES ($1, $2, 'pending') RETURNING *",
      [company_name, mobile]
    );

    // Create company admin user (pending until approved)
    await pool.query(
      "INSERT INTO users (name, mobile, password, role, company_id, status) VALUES ($1, $2, $3, 'company_admin', $4, 'pending')",
      [contact_name || company_name, mobile, hash, company.rows[0].id]
    );

    res.status(201).json({
      message: "Registration submitted. Waiting for admin approval.",
      company: company.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login (mobile + password)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ error: "Mobile and password are required" });
    }
    const result = await pool.query("SELECT * FROM users WHERE mobile = $1", [mobile]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = result.rows[0];

    // Super admin check
    if (user.role === "super_admin") {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });
      const token = jwt.sign(
        { id: user.id, name: user.name, mobile: user.mobile, role: user.role, companyId: null },
        JWT_SECRET, { expiresIn: "24h" }
      );
      return res.json({ token, user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role } });
    }

    // Company users must be approved
    if (user.status !== "active") {
      return res.status(403).json({ error: "Account pending approval. Please contact your administrator." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const company = await pool.query("SELECT * FROM companies WHERE id = $1", [user.company_id]);
    const token = jwt.sign(
      {
        id: user.id, name: user.name, mobile: user.mobile,
        role: user.role, companyId: user.company_id,
        companyName: company.rows[0]?.name || ""
      },
      JWT_SECRET, { expiresIn: "24h" }
    );
    res.json({
      token,
      user: {
        id: user.id, name: user.name, mobile: user.mobile,
        role: user.role, companyId: user.company_id,
        companyName: company.rows[0]?.name || ""
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
app.get("/api/auth/me", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, mobile, role, company_id, status FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const u = result.rows[0];
    let companyName = "";
    if (u.company_id) {
      const c = await pool.query("SELECT name FROM companies WHERE id = $1", [u.company_id]);
      companyName = c.rows[0]?.name || "";
    }
    res.json({ ...u, companyName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
//  SUPER ADMIN — Company Management
// ═══════════════════════════════════════════════════

// List all companies (with pending filter)
app.get("/api/admin/companies", auth, superAdminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT c.*, 
      (SELECT COUNT(*) FROM users WHERE company_id = c.id AND status = 'active') as user_count
      FROM companies c`;
    const params = [];
    if (status) {
      query += " WHERE c.status = $1";
      params.push(status);
    }
    query += " ORDER BY c.created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve company
app.put("/api/admin/companies/:id/approve", auth, superAdminOnly, async (req, res) => {
  try {
    const { max_users } = req.body;
    const companyId = req.params.id;

    await pool.query(
      "UPDATE companies SET status = 'active', max_users = $1 WHERE id = $2",
      [max_users || 5, companyId]
    );
    await pool.query(
      "UPDATE users SET status = 'active' WHERE company_id = $1 AND role = 'company_admin'",
      [companyId]
    );
    res.json({ message: "Company approved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject company
app.put("/api/admin/companies/:id/reject", auth, superAdminOnly, async (req, res) => {
  try {
    await pool.query("UPDATE companies SET status = 'rejected' WHERE id = $1", [req.params.id]);
    await pool.query("UPDATE users SET status = 'rejected' WHERE company_id = $1", [req.params.id]);
    res.json({ message: "Company rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update company max users
app.put("/api/admin/companies/:id/limit", auth, superAdminOnly, async (req, res) => {
  try {
    const { max_users } = req.body;
    await pool.query("UPDATE companies SET max_users = $1 WHERE id = $2", [max_users, req.params.id]);
    res.json({ message: "User limit updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
//  COMPANY ADMIN — Employee Management
// ═══════════════════════════════════════════════════

// List company employees
app.get("/api/company/employees", auth, companyAdminOrSuper, async (req, res) => {
  try {
    const companyId = req.user.role === "super_admin" ? req.query.company_id : req.user.companyId;
    if (!companyId) return res.json([]);
    const result = await pool.query(
      "SELECT id, name, mobile, role, status, created_at FROM users WHERE company_id = $1 ORDER BY created_at DESC",
      [companyId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create employee
app.post("/api/company/employees", auth, companyAdminOrSuper, async (req, res) => {
  try {
    const companyId = req.user.role === "super_admin" ? req.body.company_id : req.user.companyId;
    if (!companyId) return res.status(400).json({ error: "Company not found" });

    // Check user limit
    const company = await pool.query("SELECT max_users FROM companies WHERE id = $1", [companyId]);
    if (company.rows.length === 0) return res.status(404).json({ error: "Company not found" });

    const userCount = await pool.query(
      "SELECT COUNT(*) FROM users WHERE company_id = $1 AND role != 'company_admin'",
      [companyId]
    );
    const currentEmployees = parseInt(userCount.rows[0].count);
    const maxUsers = company.rows[0].max_users;

    if (currentEmployees >= maxUsers) {
      return res.status(403).json({ error: `User limit reached (${maxUsers}). Contact super admin to increase.` });
    }

    const { name, mobile, password } = req.body;
    if (!name || !mobile || !password) {
      return res.status(400).json({ error: "Name, mobile and password are required" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE mobile = $1", [mobile]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Mobile number already in use" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, mobile, password, role, company_id, status) VALUES ($1, $2, $3, 'employee', $4, 'active') RETURNING id, name, mobile, role, status",
      [name, mobile, hash, companyId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete employee
app.delete("/api/company/employees/:id", auth, companyAdminOrSuper, async (req, res) => {
  try {
    const companyId = req.user.role === "super_admin" ? req.query.company_id : req.user.companyId;
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 AND company_id = $2 AND role = 'employee' RETURNING id",
      [req.params.id, companyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
//  PROPERTIES (company-scoped)
// ═══════════════════════════════════════════════════

app.get("/api/properties", auth, async (req, res) => {
  try {
    const scope = req.user.role === "super_admin" ? "" : "WHERE p.company_id = $1";
    const params = req.user.role === "super_admin" ? [] : [req.user.companyId];
    const result = await pool.query(
      `SELECT p.*,
        ps.name as unit_for, pt.name as property_type, ft.name as finish_type,
        pc.name as category, u.name as handler_name
       FROM properties p
       LEFT JOIN property_statuses ps ON p.unit_for_id = ps.id
       LEFT JOIN property_types pt ON p.property_type_id = pt.id
       LEFT JOIN finish_types ft ON p.finish_type_id = ft.id
       LEFT JOIN property_categories pc ON p.category_id = pc.id
       LEFT JOIN users u ON p.handler_id = u.id
       ${scope} ORDER BY p.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/properties", auth, async (req, res) => {
  try {
    const { property_number, area, unit_for_id, property_type_id, finish_type_id,
      building, total_price, space, unit_no, description, property_offered_by,
      name, mobile, last_followup, note_of_call, new_feedback, rent_to,
      property_name_compound, handler_id, area_label, land_area, the_floors,
      category_id, inside_outside, sales } = req.body;
    const companyId = req.user.role === "super_admin" ? (req.body.company_id || null) : req.user.companyId;
    const result = await pool.query(
      `INSERT INTO properties (property_number, area, unit_for_id, property_type_id, finish_type_id,
        building, total_price, space, unit_no, description, property_offered_by,
        name, mobile, last_followup, note_of_call, new_feedback, rent_to,
        property_name_compound, handler_id, area_label, land_area, the_floors,
        category_id, inside_outside, sales, company_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27) RETURNING *`,
      [property_number || "", area || "", unit_for_id || null, property_type_id || null, finish_type_id || null,
        building || "", total_price || 0, space || "", unit_no || "", description || "", property_offered_by || "",
        name || "", mobile || "", last_followup || null, note_of_call || "", new_feedback || "", rent_to || "",
        property_name_compound || "", handler_id || null, area_label || "", land_area || "", the_floors || "",
        category_id || null, inside_outside || "", sales || "", companyId, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/properties/:id", auth, async (req, res) => {
  try {
    const { property_number, area, unit_for_id, property_type_id, finish_type_id,
      building, total_price, space, unit_no, description, property_offered_by,
      name, mobile, last_followup, note_of_call, new_feedback, rent_to,
      property_name_compound, handler_id, area_label, land_area, the_floors,
      category_id, inside_outside, sales } = req.body;
    let query = `UPDATE properties SET
      property_number = COALESCE($1,property_number), area = COALESCE($2,area),
      unit_for_id = COALESCE($3,unit_for_id), property_type_id = COALESCE($4,property_type_id),
      finish_type_id = COALESCE($5,finish_type_id), building = COALESCE($6,building),
      total_price = COALESCE($7,total_price), space = COALESCE($8,space),
      unit_no = COALESCE($9,unit_no), description = COALESCE($10,description),
      property_offered_by = COALESCE($11,property_offered_by), name = COALESCE($12,name),
      mobile = COALESCE($13,mobile), last_followup = COALESCE($14,last_followup),
      note_of_call = COALESCE($15,note_of_call), new_feedback = COALESCE($16,new_feedback),
      rent_to = COALESCE($17,rent_to), property_name_compound = COALESCE($18,property_name_compound),
      handler_id = COALESCE($19,handler_id), area_label = COALESCE($20,area_label),
      land_area = COALESCE($21,land_area), the_floors = COALESCE($22,the_floors),
      category_id = COALESCE($23,category_id), inside_outside = COALESCE($24,inside_outside),
      sales = COALESCE($25,sales), updated_at = CURRENT_TIMESTAMP
     WHERE id = $26`;
    const params = [property_number, area, unit_for_id, property_type_id, finish_type_id,
      building, total_price, space, unit_no, description, property_offered_by,
      name, mobile, last_followup, note_of_call, new_feedback, rent_to,
      property_name_compound, handler_id, area_label, land_area, the_floors,
      category_id, inside_outside, sales, req.params.id];
    if (req.user.role !== "super_admin") {
      query += " AND company_id = $27";
      params.push(req.user.companyId);
    }
    query += " RETURNING *";
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/properties/:id", auth, async (req, res) => {
  try {
    let query = "DELETE FROM properties WHERE id = $1";
    const params = [req.params.id];
    if (req.user.role !== "super_admin") {
      query += " AND company_id = $2";
      params.push(req.user.companyId);
    }
    query += " RETURNING *";
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
//  CONTACTS (company-scoped)
// ═══════════════════════════════════════════════════

app.get("/api/contacts", auth, async (req, res) => {
  try {
    if (req.user.role === "super_admin") {
      const result = await pool.query("SELECT * FROM contacts ORDER BY created_at DESC");
      return res.json(result.rows);
    }
    const result = await pool.query("SELECT * FROM contacts WHERE company_id = $1 ORDER BY created_at DESC", [req.user.companyId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/contacts", auth, async (req, res) => {
  try {
    const { name, email, phone, type, notes } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const companyId = req.user.role === "super_admin" ? (req.body.company_id || null) : req.user.companyId;
    const result = await pool.query(
      "INSERT INTO contacts (name, email, phone, type, notes, company_id, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [name, email || "", phone || "", type || "buyer", notes || "", companyId, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/contacts/:id", auth, async (req, res) => {
  try {
    const { name, email, phone, type, notes } = req.body;
    let query = `UPDATE contacts SET name = COALESCE($1,name), email = COALESCE($2,email), phone = COALESCE($3,phone),
     type = COALESCE($4,type), notes = COALESCE($5,notes), updated_at = CURRENT_TIMESTAMP WHERE id = $6`;
    const params = [name, email, phone, type, notes, req.params.id];
    if (req.user.role !== "super_admin") {
      query += " AND company_id = $7";
      params.push(req.user.companyId);
    }
    query += " RETURNING *";
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/contacts/:id", auth, async (req, res) => {
  try {
    let query = "DELETE FROM contacts WHERE id = $1";
    const params = [req.params.id];
    if (req.user.role !== "super_admin") {
      query += " AND company_id = $2";
      params.push(req.user.companyId);
    }
    query += " RETURNING *";
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
//  OPPORTUNITIES (company-scoped)
// ═══════════════════════════════════════════════════

app.get("/api/opportunities", auth, async (req, res) => {
  try {
    if (req.user.role === "super_admin") {
      const result = await pool.query(
        `SELECT o.*, c.name as contact_name, p.title as property_title
         FROM opportunities o LEFT JOIN contacts c ON o.contact_id = c.id LEFT JOIN properties p ON o.property_id = p.id ORDER BY o.created_at DESC`
      );
      return res.json(result.rows);
    }
    const result = await pool.query(
      `SELECT o.*, c.name as contact_name, p.title as property_title
       FROM opportunities o LEFT JOIN contacts c ON o.contact_id = c.id LEFT JOIN properties p ON o.property_id = p.id
       WHERE o.company_id = $1 ORDER BY o.created_at DESC`,
      [req.user.companyId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/opportunities", auth, async (req, res) => {
  try {
    const { name, contact_id, property_id, stage, amount, probability, expected_close, notes } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const companyId = req.user.role === "super_admin" ? (req.body.company_id || null) : req.user.companyId;
    const result = await pool.query(
      `INSERT INTO opportunities (name, contact_id, property_id, stage, amount, probability, expected_close, notes, company_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, contact_id || null, property_id || null, stage || "prospect", amount || null, probability || 0, expected_close || null, notes || "", companyId, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/opportunities/:id", auth, async (req, res) => {
  try {
    const { name, contact_id, property_id, stage, amount, probability, expected_close, notes } = req.body;
    let query = `UPDATE opportunities SET
      name = COALESCE($1,name), contact_id = COALESCE($2,contact_id), property_id = COALESCE($3,property_id),
      stage = COALESCE($4,stage), amount = COALESCE($5,amount), probability = COALESCE($6,probability),
      expected_close = COALESCE($7,expected_close), notes = COALESCE($8,notes), updated_at = CURRENT_TIMESTAMP WHERE id = $9`;
    const params = [name, contact_id, property_id, stage, amount, probability, expected_close, notes, req.params.id];
    if (req.user.role !== "super_admin") {
      query += " AND company_id = $10";
      params.push(req.user.companyId);
    }
    query += " RETURNING *";
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/opportunities/:id", auth, async (req, res) => {
  try {
    let query = "DELETE FROM opportunities WHERE id = $1";
    const params = [req.params.id];
    if (req.user.role !== "super_admin") {
      query += " AND company_id = $2";
      params.push(req.user.companyId);
    }
    query += " RETURNING *";
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
//  DOCUMENTS (company-scoped)
// ═══════════════════════════════════════════════════

app.get("/api/documents", auth, async (req, res) => {
  try {
    if (req.user.role === "super_admin") {
      const result = await pool.query(
        `SELECT d.*, p.title as property_title FROM documents d LEFT JOIN properties p ON d.property_id = p.id ORDER BY d.created_at DESC`
      );
      return res.json(result.rows);
    }
    const result = await pool.query(
      `SELECT d.*, p.title as property_title FROM documents d LEFT JOIN properties p ON d.property_id = p.id WHERE d.company_id = $1 ORDER BY d.created_at DESC`,
      [req.user.companyId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/documents", auth, async (req, res) => {
  try {
    const { name, type, property_id, notes } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const companyId = req.user.role === "super_admin" ? (req.body.company_id || null) : req.user.companyId;
    const result = await pool.query(
      "INSERT INTO documents (name, type, property_id, notes, company_id, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [name, type || "contract", property_id || null, notes || "", companyId, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/documents/:id", auth, async (req, res) => {
  try {
    let query = "DELETE FROM documents WHERE id = $1";
    const params = [req.params.id];
    if (req.user.role !== "super_admin") {
      query += " AND company_id = $2";
      params.push(req.user.companyId);
    }
    query += " RETURNING *";
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════

app.get("/api/dashboard", auth, async (req, res) => {
  try {
    const isSuper = req.user.role === "super_admin";
    const cid = isSuper ? null : req.user.companyId;

    const scope = cid ? `WHERE company_id = ${cid}` : "";
    const scopeLeads = cid ? `WHERE l.company_id = ${cid}` : "";

    const [props, contacts, leads, opps] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(price),0) as total_value FROM properties ${scope}`),
      pool.query(`SELECT COUNT(*) as count FROM contacts ${scope}`),
      pool.query(`SELECT COUNT(*) as count FROM leads ${scope}`),
      pool.query(`SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total_pipeline FROM opportunities ${scope}`),
    ]);

    // Leads with resolved FK names
    const recentLeads = await pool.query(
      `SELECT l.id, l.lead_number, l.last_name, l.mobile, l.last_followup, l.created_at,
        cs.name as call_status, cls.name as client_status, ut.name as unit_type,
        at.name as activity_type, u.name as assigned_to_name
       FROM leads l
       LEFT JOIN call_statuses cs ON l.call_status_id = cs.id
       LEFT JOIN client_statuses cls ON l.client_status_id = cls.id
       LEFT JOIN unit_types ut ON l.unit_type_id = ut.id
       LEFT JOIN activity_types at ON l.activity_type_id = at.id
       LEFT JOIN users u ON l.assigned_to_id = u.id
       ${scopeLeads}
       ORDER BY l.created_at DESC LIMIT 5`
    );
    const recentProperties = await pool.query(
      `SELECT * FROM properties ${scope} ORDER BY created_at DESC LIMIT 5`
    );

    // Extra lead stats
    const [answered, interested, totalAgents] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM leads l LEFT JOIN call_statuses cs ON l.call_status_id = cs.id ${scopeLeads} AND cs.name = 'تم الرد'`),
      pool.query(`SELECT COUNT(*) as count FROM leads l LEFT JOIN client_statuses cls ON l.client_status_id = cls.id ${scopeLeads} AND cls.name = 'مهتم بالايجار'`),
      cid ? pool.query(`SELECT COUNT(DISTINCT l.assigned_to_id) as count FROM leads l ${scopeLeads} AND l.assigned_to_id IS NOT NULL`) : Promise.resolve({ rows: [{ count: 0 }] }),
    ]);

    let stats = {
      totalProperties: parseInt(props.rows[0].count),
      totalValue: parseFloat(props.rows[0].total_value),
      totalContacts: parseInt(contacts.rows[0].count),
      totalLeads: parseInt(leads.rows[0].count),
      totalOpportunities: parseInt(opps.rows[0].count),
      totalPipeline: parseFloat(opps.rows[0].total_pipeline),
      totalAnswered: parseInt(answered.rows[0].count),
      totalInterested: parseInt(interested.rows[0].count),
      totalAgents: parseInt(totalAgents.rows[0].count),
    };

    if (isSuper) {
      const companies = await pool.query("SELECT COUNT(*) as count, COUNT(*) FILTER (WHERE status = 'pending') as pending FROM companies");
      stats.totalCompanies = parseInt(companies.rows[0].count);
      stats.pendingApprovals = parseInt(companies.rows[0].pending);
    }

    res.json({
      stats,
      recentLeads: recentLeads.rows,
      recentProperties: recentProperties.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
//  SUPER ADMIN — All users view
// ═══════════════════════════════════════════════════

app.get("/api/admin/users", auth, superAdminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.mobile, u.role, u.status, u.created_at, c.name as company_name
       FROM users u LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.role != 'super_admin' ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
//  LOOKUP TABLES (Company Admin manages)
// ═══════════════════════════════════════════════════

const lookupTables = ["call_statuses", "client_statuses", "unit_types", "activity_types", "property_statuses", "property_types", "finish_types", "property_categories"];

for (const tableName of lookupTables) {
  // GET all for company
  app.get(`/api/lookups/${tableName}`, auth, async (req, res) => {
    try {
      const companyId = req.user.role === "super_admin" ? req.query.company_id : req.user.companyId;
      if (!companyId) {
        // Super admin without company_id: return all
        if (req.user.role === "super_admin") {
          const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY name ASC`);
          return res.json(result.rows);
        }
        return res.json([]);
      }
      const result = await pool.query(
        `SELECT * FROM ${tableName} WHERE company_id = $1 ORDER BY name ASC`,
        [companyId]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create
  app.post(`/api/lookups/${tableName}`, auth, companyAdminOrSuper, async (req, res) => {
    try {
      const companyId = req.user.role === "super_admin" ? req.body.company_id : req.user.companyId;
      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });
      const result = await pool.query(
        `INSERT INTO ${tableName} (name, company_id) VALUES ($1, $2) ON CONFLICT (name, company_id) DO NOTHING RETURNING *`,
        [name.trim(), companyId]
      );
      if (result.rows.length === 0) return res.status(409).json({ error: "Value already exists" });
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update
  app.put(`/api/lookups/${tableName}/:id`, auth, companyAdminOrSuper, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });
      let query = `UPDATE ${tableName} SET name = $1 WHERE id = $2`;
      const params = [name.trim(), req.params.id];
      if (req.user.role !== "super_admin") {
        query += " AND company_id = $3";
        params.push(req.user.companyId);
      }
      query += " RETURNING *";
      const result = await pool.query(query, params);
      if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  app.delete(`/api/lookups/${tableName}/:id`, auth, companyAdminOrSuper, async (req, res) => {
    try {
      let query = `DELETE FROM ${tableName} WHERE id = $1`;
      const params = [req.params.id];
      if (req.user.role !== "super_admin") {
        query += " AND company_id = $2";
        params.push(req.user.companyId);
      }
      query += " RETURNING *";
      const result = await pool.query(query, params);
      if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// ═══════════════════════════════════════════════════
//  LEADS (Company-scoped, with FK lookups)
// ═══════════════════════════════════════════════════

// GET next lead number
async function getNextLeadNumber(companyId) {
  const result = await pool.query(
    "SELECT lead_number FROM leads WHERE company_id = $1 ORDER BY id DESC LIMIT 1",
    [companyId]
  );
  if (result.rows.length === 0) return "LEA10001";
  const last = result.rows[0].lead_number;
  const num = parseInt(last.replace("LEA", "")) + 1;
  return "LEA" + num;
}

// GET all leads (with resolved names)
app.get("/api/leads", auth, async (req, res) => {
  try {
    const companyId = req.user.role === "super_admin" ? req.query.company_id : req.user.companyId;

    let query = `SELECT l.*,
      cs.name as call_status,
      cls.name as client_status,
      ut.name as unit_type,
      at.name as activity_type,
      u.name as assigned_to_name
     FROM leads l
     LEFT JOIN call_statuses cs ON l.call_status_id = cs.id
     LEFT JOIN client_statuses cls ON l.client_status_id = cls.id
     LEFT JOIN unit_types ut ON l.unit_type_id = ut.id
     LEFT JOIN activity_types at ON l.activity_type_id = at.id
     LEFT JOIN users u ON l.assigned_to_id = u.id`;
    const params = [];

    if (companyId) {
      query += " WHERE l.company_id = $1";
      params.push(companyId);
    }
    query += " ORDER BY l.id DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create lead
app.post("/api/leads", auth, async (req, res) => {
  try {
    const companyId = req.user.role === "super_admin" ? (req.body.company_id || null) : req.user.companyId;
    if (!companyId) return res.status(400).json({ error: "Company not found" });

    const leadNumber = await getNextLeadNumber(companyId);
    const { salutation, last_name, mobile, call_status_id, client_status_id, unit_type_id, activity_type_id, assigned_to_id, last_followup, feedback, description } = req.body;

    if (!last_name || !last_name.trim()) return res.status(400).json({ error: "Last Name is required" });

    const result = await pool.query(
      `INSERT INTO leads (lead_number, salutation, last_name, mobile, call_status_id, client_status_id, unit_type_id, activity_type_id, assigned_to_id, last_followup, feedback, description, last_modified_by, company_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [leadNumber, salutation || "", last_name.trim(), mobile || "", call_status_id || null, client_status_id || null, unit_type_id || null, activity_type_id || null, assigned_to_id || null, last_followup || null, feedback || "", description || "", req.user.name, companyId, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update lead
app.put("/api/leads/:id", auth, async (req, res) => {
  try {
    const { salutation, last_name, mobile, call_status_id, client_status_id, unit_type_id, activity_type_id, assigned_to_id, last_followup, feedback, description } = req.body;

    let query = `UPDATE leads SET
      salutation = COALESCE($1, salutation),
      last_name = COALESCE($2, last_name),
      mobile = COALESCE($3, mobile),
      call_status_id = $4,
      client_status_id = $5,
      unit_type_id = $6,
      activity_type_id = $7,
      assigned_to_id = $8,
      last_followup = $9,
      feedback = COALESCE($10, feedback),
      description = COALESCE($11, description),
      last_modified_by = $12,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $13`;
    const params = [salutation, last_name, mobile, call_status_id || null, client_status_id || null, unit_type_id || null, activity_type_id || null, assigned_to_id || null, last_followup || null, feedback, description, req.user.name, req.params.id];

    if (req.user.role !== "super_admin") {
      query += " AND company_id = $14";
      params.push(req.user.companyId);
    }
    query += " RETURNING *";
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE lead
app.delete("/api/leads/:id", auth, async (req, res) => {
  try {
    let query = "DELETE FROM leads WHERE id = $1";
    const params = [req.params.id];
    if (req.user.role !== "super_admin") {
      query += " AND company_id = $2";
      params.push(req.user.companyId);
    }
    query += " RETURNING *";
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
//  CSV IMPORT (Admin only)
// ═══════════════════════════════════════════════════

app.post("/api/import/leads", auth, companyAdminOrSuper, async (req, res) => {
  try {
    const companyId = req.user.role === "super_admin" ? (req.body.company_id || null) : req.user.companyId;
    if (!companyId) return res.status(400).json({ error: "Company not found" });

    const { rows } = req.body; // array of CSV rows already parsed
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No data rows provided" });
    }

    // Helper: get or create lookup value
    async function getOrCreate(table, name, companyId) {
      if (!name || !name.trim()) return null;
      const trimmed = name.trim();
      let result = await pool.query(`SELECT id FROM ${table} WHERE name = $1 AND company_id = $2`, [trimmed, companyId]);
      if (result.rows.length > 0) return result.rows[0].id;
      result = await pool.query(`INSERT INTO ${table} (name, company_id) VALUES ($1, $2) RETURNING id`, [trimmed, companyId]);
      return result.rows[0].id;
    }

    // Get or create agent user
    async function getOrCreateAgent(name, companyId) {
      if (!name || !name.trim()) return null;
      const trimmed = name.trim();
      let result = await pool.query(`SELECT id FROM users WHERE name = $1 AND company_id = $2`, [trimmed, companyId]);
      if (result.rows.length > 0) return result.rows[0].id;
      // Create agent as employee
      const hash = await bcrypt.hash("agent123", 10);
      result = await pool.query(
        `INSERT INTO users (name, mobile, password, role, company_id, status) VALUES ($1, $2, $3, 'employee', $4, 'active') ON CONFLICT (mobile) DO NOTHING RETURNING id`,
        [trimmed, `agent_${trimmed.toLowerCase()}_${companyId}`, hash, companyId]
      );
      if (result.rows.length > 0) return result.rows[0].id;
      result = await pool.query(`SELECT id FROM users WHERE name = $1 AND company_id = $2`, [trimmed, companyId]);
      return result.rows.length > 0 ? result.rows[0].id : null;
    }

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        const leadNumber = row["Lead Number"] || "";
        if (!leadNumber) { skipped++; continue; }

        // Check if already exists
        const exists = await pool.query("SELECT id FROM leads WHERE lead_number = $1 AND company_id = $2", [leadNumber, companyId]);
        if (exists.rows.length > 0) { skipped++; continue; }

        const callStatusId = await getOrCreate("call_statuses", row["\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0647"], companyId);
        const clientStatusId = await getOrCreate("client_statuses", row["\u062d\u0627\u0644\u0647 \u0627\u0644\u0639\u0645\u064a\u0644"], companyId);
        const unitTypeId = await getOrCreate("unit_types", row["\u0646\u0648\u0639 \u0627\u0644\u0648\u062d\u062f\u0647 \u0627\u0644\u0645\u0647\u062a\u0645 \u0628\u0647\u0627 \u0627\u0644\u0639\u0645\u064a\u0644"], companyId);
        const activityTypeId = await getOrCreate("activity_types", row["\u0646\u0648\u0639 \u0627\u0644\u0646\u0634\u0627\u0637"], companyId);
        const assignedToId = await getOrCreateAgent(row["Assigned To"], companyId);

        // Parse date
        function parseDate(d) {
          if (!d || !d.trim()) return null;
          const parts = d.trim().split("-");
          if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
          return null;
        }

        await pool.query(
          `INSERT INTO leads (lead_number, salutation, last_name, mobile, call_status_id, client_status_id, unit_type_id, activity_type_id, assigned_to_id, last_followup, feedback, description, last_modified_by, company_id, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [
            leadNumber,
            row["Salutation"] || "",
            row["Last Name"] || "",
            row["MOBILE 1"] || "",
            callStatusId, clientStatusId, unitTypeId, activityTypeId, assignedToId,
            parseDate(row["\u0627\u062e\u0631 \u0645\u062a\u0627\u0628\u0639\u0647"]),
            row["\u0641\u064a\u062f\u0628\u0627\u0643"] || "",
            row["Description"] || "",
            row["Last Modified By"] || "",
            companyId, req.user.id
          ]
        );
        imported++;
      } catch (e) {
        console.error("Import row error:", e.message);
        skipped++;
      }
    }

    res.json({ message: `Imported ${imported} leads, skipped ${skipped}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/import/properties", auth, companyAdminOrSuper, async (req, res) => {
  try {
    const companyId = req.user.role === "super_admin" ? (req.body.company_id || null) : req.user.companyId;
    if (!companyId) return res.status(400).json({ error: "Company not found" });

    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No data rows provided" });
    }

    async function getOrCreate(table, name, companyId) {
      if (!name || !name.trim()) return null;
      const trimmed = name.trim().substring(0, 100);
      let result = await pool.query(`SELECT id FROM ${table} WHERE name = $1 AND company_id = $2`, [trimmed, companyId]);
      if (result.rows.length > 0) return result.rows[0].id;
      result = await pool.query(`INSERT INTO ${table} (name, company_id) VALUES ($1, $2) RETURNING id`, [trimmed, companyId]);
      return result.rows[0].id;
    }

    async function getOrCreateAgent(name, companyId) {
      if (!name || !name.trim()) return null;
      const trimmed = name.trim();
      let result = await pool.query(`SELECT id FROM users WHERE name = $1 AND company_id = $2`, [trimmed, companyId]);
      if (result.rows.length > 0) return result.rows[0].id;
      const hash = await bcrypt.hash("agent123", 10);
      result = await pool.query(
        `INSERT INTO users (name, mobile, password, role, company_id, status) VALUES ($1, $2, $3, 'employee', $4, 'active') ON CONFLICT (mobile) DO NOTHING RETURNING id`,
        [trimmed, `agent_${trimmed.toLowerCase()}_${companyId}`, hash, companyId]
      );
      if (result.rows.length > 0) return result.rows[0].id;
      result = await pool.query(`SELECT id FROM users WHERE name = $1 AND company_id = $2`, [trimmed, companyId]);
      return result.rows.length > 0 ? result.rows[0].id : null;
    }

    function parsePrice(p) {
      if (!p) return 0;
      return parseFloat(String(p).replace(/,/g, '')) || 0;
    }

    function parseDate(d) {
      if (!d || !d.trim() || d.trim() === '--' || d.trim() === '-' || d.trim() === '0' || d.trim() === '0000-00-00') return null;
      const parts = d.trim().split(/[-/]/);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        // Validate the date parts are reasonable
        const y = parseInt(parts[2]), m = parseInt(parts[1]), day = parseInt(parts[0]);
        if (isNaN(y) || isNaN(m) || isNaN(day) || y < 1900 || y > 2100 || m < 1 || m > 12 || day < 1 || day > 31) return null;
        return dateStr;
      }
      return null;
    }

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        const propNum = row["Property Number"] || "";
        if (!propNum) { skipped++; continue; }

        const exists = await pool.query("SELECT id FROM properties WHERE property_number = $1 AND company_id = $2", [propNum, companyId]);
        if (exists.rows.length > 0) { skipped++; continue; }

        const unitForId = await getOrCreate("property_statuses", row["Unit For"], companyId);
        const propTypeId = await getOrCreate("property_types", row["Type"], companyId);
        const finishTypeId = await getOrCreate("finish_types", row["Finished"], companyId);
        const categoryId = await getOrCreate("property_categories", row["STATUS"], companyId);
        const handlerId = await getOrCreateAgent(row["Handler"], companyId);

        await pool.query(
          `INSERT INTO properties (property_number, area, unit_for_id, property_type_id, finish_type_id,
            building, total_price, space, unit_no, description, property_offered_by,
            name, mobile, last_followup, note_of_call, new_feedback,
            property_name_compound, handler_id, area_label, land_area, the_floors,
            category_id, inside_outside, sales, last_modified_by, company_id, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)`,
          [
            propNum,
            row["Area"] || "",
            unitForId, propTypeId, finishTypeId,
            row["Building"] || "",
            parsePrice(row["Total Price"]),
            row["SPACE \\ M"] || row["SPACE \\M"] || row["SPACE \ M"] || "",
            row["Unit NO"] || "",
            row["Description"] || "",
            row["Property Offered By"] || "",
            row["Name"] || "",
            row["Mobile No."] || "",
            parseDate(row["Last Follow in"]),
            row["NOTE OF CALL"] || row["ابديت المكالمات"] || "",
            row["NEW FEEDBACK"] || "",
            row["Property Name - Compound Name"] || "",
            handlerId,
            row["AREA LABLE"] || "",
            row["Land area"] || "",
            row["The Floors"] || "",
            categoryId,
            row["داخل كمبوند / خارج كمبوند"] || "",
            row["Sales"] || "",
            row["Last Modified By"] || "",
            companyId, req.user.id
          ]
        );
        imported++;
      } catch (e) {
        console.error("Property import error:", e.message);
        skipped++;
      }
    }

    res.json({ message: `Imported ${imported} properties, skipped ${skipped}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Catch-all ───
app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

// ─── Start ───
initDB().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`CB SaaS CRM running at http://${HOST}:${PORT}`);
  });
});
