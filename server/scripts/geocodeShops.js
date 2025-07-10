require('dotenv').config();
const axios = require('axios');
const pool = require('../db');

const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;

const geocodeAddress = async (address) => {
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${OPENCAGE_API_KEY}`;
  try {
    const res = await axios.get(url);
    const result = res.data.results[0];
    if (result) {
      return {
        lat: result.geometry.lat,
        lng: result.geometry.lng,
      };
    }
    return null;
  } catch (err) {
    console.error('❌ Geocoding failed:', err.message);
    return null;
  }
};

const updateShopsWithCoordinates = async () => {
  try {
    const result = await pool.query(`SELECT id, name, address FROM shops WHERE lat IS NULL OR lng IS NULL`);
    const shops = result.rows;

    for (const shop of shops) {
      console.log(`🌐 Geocoding "${shop.name}"...`);
      const coords = await geocodeAddress(shop.address);
      if (coords) {
        await pool.query(
          `UPDATE shops SET lat = $1, lng = $2 WHERE id = $3`,
          [coords.lat, coords.lng, shop.id]
        );
        console.log(`✅ Updated ${shop.name} → (${coords.lat}, ${coords.lng})`);
      } else {
        console.warn(`⚠️ Skipped ${shop.name} — no result`);
      }

      // Delay to respect rate limits (OpenCage allows ~1 request/second on free tier)
      await new Promise((res) => setTimeout(res, 1200));
    }

    console.log('🎉 All shops updated.');
    process.exit();
  } catch (err) {
    console.error('❌ Error updating shops:', err);
    process.exit(1);
  }
};

updateShopsWithCoordinates();
