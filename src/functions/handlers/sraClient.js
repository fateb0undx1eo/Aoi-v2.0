// src/functions/handlers/sraClient.js

const fetch = global.fetch;

const API_BASE = "https://api.some-random-api.com";

const TOKEN = process.env.SRA_TOKEN; // put token in .env

if (!TOKEN) {
  console.warn("⚠️ SRA_TOKEN not set in .env");
}

async function getCanvas(endpoint, params = {}) {
  const query = new URLSearchParams(params).toString();

  const url = `${API_BASE}/${endpoint}?${query}`;

  const res = await fetch(url, {
    headers: {
      Authorization: TOKEN
    }
  });

  if (!res.ok) {
    throw new Error(`SRA API Error: ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

module.exports = {
  getCanvas
};
