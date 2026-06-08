@echo off
echo ========================================
echo Cloudinary Deletion Deployment Script
echo ========================================
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Firebase CLI is not installed!
    echo Install it with: npm install -g firebase-tools
    pause
    exit /b 1
)

echo [OK] Firebase CLI detected
echo.

REM Check if logged in
echo Checking Firebase authentication...
firebase projects:list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Not logged in to Firebase
    echo Logging in...
    firebase login
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Login failed!
        pause
        exit /b 1
    )
)
echo [OK] Authenticated
echo.

REM Install dependencies
echo Installing Firebase Functions dependencies...
cd functions
if not exist "node_modules\" (
    echo Installing packages...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies!
        cd ..
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)
cd ..
echo.

REM Check if config is set
echo Checking Cloudinary configuration...
firebase functions:config:get cloudinary.cloud_name >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Cloudinary credentials not configured!
    echo.
    echo Please set your Cloudinary credentials:
    echo (Find them at: https://cloudinary.com/console)
    echo.
    set /p CLOUD_NAME="Cloud Name [dvaoenkgr]: "
    if "%CLOUD_NAME%"=="" set CLOUD_NAME=dvaoenkgr
    
    set /p API_KEY="API Key: "
    if "%API_KEY%"=="" (
        echo [ERROR] API Key is required!
        pause
        exit /b 1
    )
    
    set /p API_SECRET="API Secret: "
    if "%API_SECRET%"=="" (
        echo [ERROR] API Secret is required!
        pause
        exit /b 1
    )
    
    echo.
    echo Setting configuration...
    firebase functions:config:set cloudinary.cloud_name="%CLOUD_NAME%" cloudinary.api_key="%API_KEY%" cloudinary.api_secret="%API_SECRET%"
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to set configuration!
        pause
        exit /b 1
    )
    echo [OK] Configuration set
) else (
    echo [OK] Configuration already set
)
echo.

REM Deploy functions
echo Deploying Firebase Functions...
firebase deploy --only functions
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Deployment failed!
    echo.
    echo Troubleshooting tips:
    echo 1. Check functions/index.js for syntax errors
    echo 2. Ensure you have billing enabled on Firebase
    echo 3. Run: firebase functions:log to see errors
    pause
    exit /b 1
)
echo [OK] Functions deployed successfully!
echo.

REM Deploy Firestore rules
echo Deploying Firestore security rules...
cd admin
firebase deploy --only firestore:rules
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Firestore rules deployment failed (may be okay)
) else (
    echo [OK] Firestore rules deployed
)
cd ..
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Test by deleting a hoarding with images
echo 2. Check Cloudinary console to verify deletion
echo 3. Monitor logs with: firebase functions:log
echo.
echo For detailed documentation, see: CLOUDINARY_SETUP_GUIDE.md
echo.
pause
