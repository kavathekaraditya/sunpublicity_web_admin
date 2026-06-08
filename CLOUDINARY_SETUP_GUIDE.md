# Cloudinary Deletion Setup Guide

## 🎯 Overview

This guide will help you set up secure Cloudinary asset deletion using Firebase Cloud Functions. Assets will be deleted from Cloudinary when admins delete hoardings, media, or gallery images.

## ✅ Implementation Summary

### What's Been Implemented:
1. ✅ Firebase Cloud Functions for secure deletion
2. ✅ Admin/Superadmin role verification
3. ✅ Single and bulk deletion endpoints
4. ✅ Automatic Firestore triggers
5. ✅ Frontend integration with proper error handling
6. ✅ Support for images and videos
7. ✅ Cloudinary deletion BEFORE Firestore deletion

### Files Updated:
- `/functions/index.js` - Cloud Functions (NEW)
- `/functions/package.json` - Dependencies (NEW)
- `/admin/src/config/cloudinary.js` - Updated deleteFromCloudinary()
- `/admin/src/pages/ManageHoardings.jsx` - Updated deletion logic
- `/admin/src/services/mediaService.js` - Updated media deletion
- `/admin/src/pages/AdminHero.jsx` - Updated gallery image deletion

## 📋 Setup Instructions

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Install Functions Dependencies

```bash
cd functions
npm install
```

This installs:
- `firebase-admin` - Firebase Admin SDK
- `firebase-functions` - Cloud Functions SDK
- `cloudinary` - Cloudinary SDK for asset deletion

### Step 4: Configure Cloudinary Credentials

You need to set your Cloudinary API credentials. Get them from:
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Navigate to **Settings** → **API Keys**
3. Copy your **Cloud Name**, **API Key**, and **API Secret**

#### Set Firebase Functions Config:

```bash
firebase functions:config:set \
  cloudinary.cloud_name="dvaoenkgr" \
  cloudinary.api_key="YOUR_API_KEY_HERE" \
  cloudinary.api_secret="YOUR_API_SECRET_HERE"
```

**Important:** Replace `YOUR_API_KEY_HERE` and `YOUR_API_SECRET_HERE` with your actual credentials!

#### Verify Configuration:

```bash
firebase functions:config:get
```

You should see:
```json
{
  "cloudinary": {
    "cloud_name": "dvaoenkgr",
    "api_key": "your_key",
    "api_secret": "your_secret"
  }
}
```

### Step 5: Deploy Firebase Functions

```bash
# Make sure you're in the project root directory
cd ..

# Deploy all functions
firebase deploy --only functions
```

You should see output like:
```
✔  functions[deleteCloudinaryAsset(us-central1)] Successful create operation.
✔  functions[deleteCloudinaryAssets(us-central1)] Successful create operation.
✔  functions[onHoardingDelete(us-central1)] Successful create operation.
✔  functions[onMediaDelete(us-central1)] Successful create operation.
✔  functions[onHeroUpdate(us-central1)] Successful create operation.
```

### Step 6: Update Firestore Security Rules

Make sure your Firestore rules allow admins to delete:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin or superadmin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
    }
    
    // Hoardings
    match /categories/{category}/hoardings/{hoarding} {
      allow read: if true;
      allow write, delete: if isAdmin();
    }
    
    // Media
    match /media/{mediaId} {
      allow read: if true;
      allow write, delete: if isAdmin();
    }
    
    // Hero Section
    match /hero_section/{docId} {
      allow read: if true;
      allow write, update: if isAdmin();
    }
    
    // Users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || isAdmin();
    }
  }
}
```

Deploy the rules:

```bash
firebase deploy --only firestore:rules
```

### Step 7: Test the Implementation

#### Test 1: Delete a Hoarding

1. Log in as an admin user
2. Go to **Manage Hoardings**
3. Select a hoarding with images
4. Click **Delete**
5. Confirm deletion

**Expected Result:**
- ✅ Images deleted from Cloudinary first
- ✅ Firestore document deleted after
- ✅ Success message displayed

#### Test 2: Check Firebase Logs

```bash
firebase functions:log
```

You should see logs like:
```
User xxx (admin) requesting deletion of image: hoardings/xyz
Successfully deleted image: hoardings/xyz
Hoarding deleted: abc123, auto-cleaning Cloudinary assets...
```

#### Test 3: Verify in Cloudinary

1. Go to [Cloudinary Media Library](https://cloudinary.com/console/media_library)
2. Search for the deleted asset
3. Confirm it's been removed

## 🔄 How It Works

### Manual Deletion Flow

```
1. Admin clicks "Delete" button
2. Frontend extracts publicId from image URL
3. Frontend calls deleteFromCloudinary(publicId)
   ↓
4. Firebase Cloud Function:
   - Verifies user is admin/superadmin
   - Calls cloudinary.uploader.destroy(publicId)
   - Returns success/error
   ↓
5. If Cloudinary deletion succeeds:
   - Delete Firestore document
   - Show success message
6. If Cloudinary deletion fails:
   - Show error message
   - Keep Firestore document (prevents orphaned records)
```

### Automatic Deletion (Firestore Triggers)

```
1. Firestore document deleted (manually or via console)
   ↓
2. Firestore trigger fires automatically
   ↓
3. Trigger extracts image URLs from deleted document
   ↓
4. Trigger deletes assets from Cloudinary
   ↓
5. Cleanup complete (no orphaned assets)
```

## 🛠️ Available Functions

### 1. deleteCloudinaryAsset (Callable)

Deletes a single asset.

**Frontend Usage:**
```javascript
import { deleteFromCloudinary } from '../config/cloudinary';

await deleteFromCloudinary(publicId, 'image'); // or 'video'
```

**Request:**
```json
{
  "publicId": "hoardings/image-name",
  "resourceType": "image"
}
```

**Response:**
```json
{
  "success": true,
  "message": "image deleted successfully from Cloudinary",
  "result": { "result": "ok" }
}
```

### 2. deleteCloudinaryAssets (Callable)

Deletes multiple assets at once.

**Request:**
```json
{
  "publicIds": ["hoardings/img1", "hoardings/img2"],
  "resourceType": "image"
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "success": ["hoardings/img1", "hoardings/img2"],
    "failed": [],
    "notFound": []
  },
  "message": "Deleted: 2, Not found: 0, Failed: 0"
}
```

### 3. onHoardingDelete (Trigger)

Automatically fires when a hoarding is deleted.

### 4. onMediaDelete (Trigger)

Automatically fires when media is deleted.

### 5. onHeroUpdate (Trigger)

Automatically fires when hero section is updated (removes old images/videos).

## 🐛 Troubleshooting

### Error: "Unauthenticated"

**Cause:** User is not logged in.

**Solution:**
1. Check if user is logged in
2. Verify Firebase Authentication is working
3. Check AuthContext

### Error: "Permission Denied"

**Cause:** User is not an admin or superadmin.

**Solution:**
1. Check user's role in Firestore:
   ```
   users/{userId}/role
   ```
2. Role must be exactly "admin" or "superadmin" (case-sensitive)
3. Update user role if needed:
   ```javascript
   await updateDoc(doc(db, 'users', userId), { role: 'admin' });
   ```

### Error: "Invalid Cloudinary Credentials"

**Cause:** Cloudinary credentials not set or incorrect.

**Solution:**
1. Verify credentials are set:
   ```bash
   firebase functions:config:get
   ```
2. Reset credentials:
   ```bash
   firebase functions:config:set cloudinary.cloud_name="xxx" cloudinary.api_key="xxx" cloudinary.api_secret="xxx"
   ```
3. Redeploy functions:
   ```bash
   firebase deploy --only functions
   ```

### Images Not Deleting

**Cause:** Various reasons.

**Solutions:**
1. Check Firebase Functions logs:
   ```bash
   firebase functions:log --only deleteCloudinaryAsset
   ```

2. Verify publicId extraction:
   ```javascript
   const publicId = extractPublicId(imageUrl);
   console.log('Extracted publicId:', publicId);
   ```

3. Test manually in Cloudinary console

4. Check Cloudinary API status

### Functions Not Deployed

**Cause:** Deployment failed.

**Solution:**
1. Check for syntax errors in functions/index.js
2. Ensure dependencies are installed:
   ```bash
   cd functions && npm install
   ```
3. Check Firebase project is selected:
   ```bash
   firebase use --add
   ```
4. Try deploying specific function:
   ```bash
   firebase deploy --only functions:deleteCloudinaryAsset
   ```

## 📊 Monitoring

### View Function Logs

```bash
# All logs
firebase functions:log

# Specific function
firebase functions:log --only deleteCloudinaryAsset

# Real-time logs
firebase functions:log --follow
```

### Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Functions**
4. View logs, metrics, and health

### Cloudinary Console

1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Navigate to **Media Library**
3. Monitor storage usage
4. View deletion activity in **Reports**

## 🔐 Security Best Practices

1. ✅ **Never expose Cloudinary credentials in frontend code**
2. ✅ **Always use Cloud Functions for deletion**
3. ✅ **Verify user roles before deletion**
4. ✅ **Use HTTPS for all API calls**
5. ✅ **Log all deletion operations**
6. ✅ **Validate all inputs in Cloud Functions**
7. ✅ **Set up Firebase Security Rules properly**
8. ✅ **Regularly review deletion logs**

## 💰 Cost Considerations

### Firebase Functions
- **Free tier:** 2M invocations/month
- **Typical usage:** ~10-100 deletions/day = ~3000/month
- **Estimate:** Free for most applications

### Cloudinary
- **Free tier:** 25GB storage, 25GB bandwidth
- **Deletion:** FREE (no charges for deletions)
- **Benefit:** Saves storage costs by removing unused assets

## 🚀 Advanced Usage

### Bulk Delete by Prefix

If you need to delete all assets in a folder:

```javascript
// In Cloud Function
const result = await cloudinary.api.resources({
  type: 'upload',
  resource_type: 'image',
  prefix: 'hoardings/old-category',
  max_results: 500
});

const publicIds = result.resources.map(r => r.public_id);

await cloudinary.api.delete_resources(publicIds, {
  resource_type: 'image',
  invalidate: true
});
```

### Delete Videos

Works the same as images:

```javascript
await deleteFromCloudinary(publicId, 'video');
```

### Retry Failed Deletions

Add retry logic for network failures:

```javascript
const deleteWithRetry = async (publicId, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await deleteFromCloudinary(publicId);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## ✅ Verification Checklist

- [ ] Firebase CLI installed
- [ ] Logged in to Firebase
- [ ] Functions dependencies installed
- [ ] Cloudinary credentials configured
- [ ] Functions deployed successfully
- [ ] Firestore rules deployed
- [ ] Test deletion works
- [ ] Cloudinary assets actually deleted
- [ ] Firebase logs show deletion
- [ ] Error handling works properly

## 📞 Support

If you encounter issues:

1. Check Firebase Functions logs
2. Verify Cloudinary credentials
3. Review Firestore security rules
4. Test with a simple deletion
5. Check network connectivity
6. Ensure admin permissions are set

## 🎉 Success!

Once setup is complete:
- ✅ Admins can securely delete assets
- ✅ No orphaned files in Cloudinary
- ✅ Automatic cleanup with Firestore triggers
- ✅ Proper error handling and logging
- ✅ Cost savings from removed assets

---

**Last Updated:** June 5, 2026
**Version:** 2.0.0
