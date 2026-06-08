const fs = require('fs');
const path = require('path');

// Manually parse .env from functions directory
const envPath = path.join(__dirname, '..', '..', '..', '..', '..', 'Desktop', 'SunPublicity-Combined', 'functions', '.env');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    process.env[key] = value;
  });
  console.log('Successfully loaded .env file');
} catch (e) {
  console.error('Error loading .env file:', e.message);
}

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary Configured Name:', cloudinary.config().cloud_name);
console.log('Cloudinary Configured API Key:', cloudinary.config().api_key);

// Test helper logic for extracting publicId
function extractPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const pathAfterUpload = parts[1];
    const pathParts = pathAfterUpload.split('/');
    const relevantParts = pathParts.filter(part => !part.match(/^v\d+$/));
    const publicId = relevantParts.join('/').replace(/\.[^/.]+$/, '');
    return publicId;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

const testUrls = [
  'https://res.cloudinary.com/dvaoenkgr/image/upload/v1717528282/hoardings/test-image.jpg',
  'http://res.cloudinary.com/dvaoenkgr/image/upload/v99999/test-folder/subfolder/img.png',
  'https://res.cloudinary.com/dvaoenkgr/video/upload/v1/hero/promo.mp4', // Note: split('/upload/') should still work if it's there
  'https://res.cloudinary.com/dvaoenkgr/image/upload/hoardings/no-version.jpg'
];

console.log('\n--- Extraction Tests ---');
for (const url of testUrls) {
  console.log(`URL: ${url}`);
  console.log(`Extracted publicId: ${extractPublicIdFromUrl(url)}`);
}
