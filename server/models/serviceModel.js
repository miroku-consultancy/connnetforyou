const pool = require("../db");

const serviceModel = {
  // Get published services for the public marketplace
  async getPublishedServices({ shopId, category, search } = {}) {
    const values = [];
    const conditions = ["s.status = 'published'"];

    if (shopId) {
      values.push(shopId);
      conditions.push(`s.shop_id = $${values.length}`);
    }

    if (category) {
      values.push(category);
      conditions.push(`s.category = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(
        `(s.title ILIKE $${values.length}
          OR s.description ILIKE $${values.length}
          OR sh.name ILIKE $${values.length})`
      );
    }

    const query = `
      SELECT
        s.id,
        s.shop_id,
        s.title,
        s.description,
        s.category,
        s.price,
        s.pricing_type,
        s.image_url,
        s.status,
        s.created_at,
        sh.name AS business_name,
        sh.slug AS shop_slug,
        sh.address,
        sh.phone,
        t.slug AS tenant_slug
      FROM services s
      JOIN shops sh ON sh.id = s.shop_id
      LEFT JOIN tenants t ON t.shop_id = sh.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY s.created_at DESC
    `;

    const { rows } = await pool.query(query, values);
    return rows;
  },

  // Get one service by ID
  async getServiceById(id) {
    const { rows } = await pool.query(
      `SELECT
         s.*,
         sh.name AS business_name,
         sh.slug AS shop_slug,
         sh.address,
         sh.phone,
         t.slug AS tenant_slug
       FROM services s
       JOIN shops sh ON sh.id = s.shop_id
       LEFT JOIN tenants t ON t.shop_id = sh.id
       WHERE s.id = $1`,
      [id]
    );

    return rows[0] || null;
  },

  // Create a service for a shop
  async createService(data) {
    const {
      shop_id,
      title,
      description,
      category,
      price,
      pricing_type,
      image_url,
      status
    } = data;

    const { rows } = await pool.query(
      `INSERT INTO services (
         shop_id,
         title,
         description,
         category,
         price,
         pricing_type,
         image_url,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        shop_id,
        title,
        description || null,
        category || null,
        price ?? null,
        pricing_type || "fixed",
        image_url || null,
        status || "draft"
      ]
    );

    return rows[0];
  },

  // Update only a service owned by this shop
  async updateService(id, shopId, data) {
    const {
      title,
      description,
      category,
      price,
      pricing_type,
      image_url,
      status
    } = data;

    const { rows } = await pool.query(
      `UPDATE services
       SET title = $1,
           description = $2,
           category = $3,
           price = $4,
           pricing_type = $5,
           image_url = COALESCE($6, image_url),
           status = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND shop_id = $9
       RETURNING *`,
      [
        title,
        description || null,
        category || null,
        price ?? null,
        pricing_type || "fixed",
        image_url || null,
        status || "draft",
        id,
        shopId
      ]
    );

    return rows[0] || null;
  },

  // Delete only a service owned by this shop
  async deleteService(id, shopId) {
    const { rows } = await pool.query(
      `DELETE FROM services
       WHERE id = $1 AND shop_id = $2
       RETURNING id`,
      [id, shopId]
    );

    return rows.length > 0;
  }
};

module.exports = serviceModel;