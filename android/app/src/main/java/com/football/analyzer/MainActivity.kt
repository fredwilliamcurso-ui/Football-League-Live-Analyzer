package com.football.analyzer

import android.Manifest
import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.football.analyzer.capture.MediaProjectionService

class MainActivity : AppCompatActivity() {

    private val TAG = "MainActivity"
    private var statusText: TextView? = null
    private var btnToggleOverlay: Button? = null
    private var btnGrantOverlayPermission: Button? = null
    private var btnOpenBoomplay: Button? = null

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        Log.i(TAG, "Notification permission granted: $isGranted")
        updateUIState()
    }

    private val mediaProjectionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        Log.i(TAG, "MediaProjection result received: resultCode=${result.resultCode}, hasData=${result.data != null}")
        try {
            if (result.resultCode == Activity.RESULT_OK && result.data != null) {
                statusText?.text = "🟢 Screen capture permission GRANTED! Starting Floating HUD..."
                Toast.makeText(this, "⚽ Screen Observer & HUD Active!", Toast.LENGTH_SHORT).show()

                val serviceIntent = Intent(this, MediaProjectionService::class.java).apply {
                    putExtra("RESULT_CODE", result.resultCode)
                    putExtra("DATA_INTENT", result.data)
                }
                ContextCompat.startForegroundService(this, serviceIntent)
                updateUIState()

                // Auto minimize so floating HUD is immediately visible over Boomplay or desktop
                Handler(Looper.getMainLooper()).postDelayed({
                    moveTaskToBack(true)
                }, 600)
            } else {
                statusText?.text = "⚠️ Screen capture permission was cancelled or denied.\n\nPlease tap 'START LIVE SCREEN OBSERVER' again and select 'Start now' / 'Entire screen'."
                Toast.makeText(this, "Screen capture permission required for live match analysis.", Toast.LENGTH_LONG).show()
                updateUIState()
            }
        } catch (e: Throwable) {
            Log.e(TAG, "Error starting projection service", e)
            showErrorDialog("Failed to start Screen Observer service: ${e.message}")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        try {
            setContentView(R.layout.activity_main)

            statusText = findViewById(R.id.textStatus)
            btnToggleOverlay = findViewById(R.id.btnToggleOverlay)
            btnGrantOverlayPermission = findViewById(R.id.btnGrantOverlayPermission)
            btnOpenBoomplay = findViewById(R.id.btnOpenBoomplay)

            btnGrantOverlayPermission?.setOnClickListener {
                onGrantOverlayClicked(it)
            }

            btnToggleOverlay?.setOnClickListener {
                onStartObserverClicked(it)
            }

            btnOpenBoomplay?.setOnClickListener {
                onOpenBoomplayClicked(it)
            }

            checkNotificationPermission()
            updateUIState()
            Log.i(TAG, "MainActivity initialized successfully")
        } catch (e: Throwable) {
            Log.e(TAG, "Fatal error inflating activity_main", e)
            showErrorDialog("Initialization error: ${e.message}")
        }
    }

    override fun onResume() {
        super.onResume()
        updateUIState()
    }

    fun onGrantOverlayClicked(view: View?) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(this)) {
                    statusText?.text = "Opening Overlay Permission Settings...\nEnable 'Display over other apps' for Football Analyzer, then return here."
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    )
                    startActivity(intent)
                } else {
                    Toast.makeText(this, "Overlay permission already granted ✓", Toast.LENGTH_SHORT).show()
                    updateUIState()
                }
            } else {
                Toast.makeText(this, "Overlay permission granted", Toast.LENGTH_SHORT).show()
                updateUIState()
            }
        } catch (e: Throwable) {
            Log.e(TAG, "Error opening overlay settings", e)
            showErrorDialog("Cannot open overlay settings: ${e.message}")
        }
    }

    fun onStartObserverClicked(view: View?) {
        Log.i(TAG, "START LIVE SCREEN OBSERVER clicked")
        try {
            if (MediaProjectionService.isRunning) {
                // Stop service
                stopService(Intent(this, MediaProjectionService::class.java))
                Toast.makeText(this, "Live Screen Observer stopped.", Toast.LENGTH_SHORT).show()
                statusText?.text = "Screen observer stopped. Press 'START LIVE SCREEN OBSERVER' to start again."
                updateUIState()
                return
            }

            // Check overlay permission
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                statusText?.text = "⚠️ OVERLAY PERMISSION REQUIRED:\nPlease tap 'Grant Overlay Permission' first to allow the floating HUD to display over Boomplay."
                Toast.makeText(this, "Please enable 'Display over other apps' first.", Toast.LENGTH_LONG).show()
                onGrantOverlayClicked(view)
                return
            }

            // Request MediaProjection
            requestMediaProjection()
        } catch (e: Throwable) {
            Log.e(TAG, "Error in onStartObserverClicked", e)
            showErrorDialog("Start Observer error: ${e.message}")
        }
    }

    fun onOpenBoomplayClicked(view: View?) {
        Log.i(TAG, "=== Boomplay App Detection & Launch Initiated ===")
        Log.i(TAG, "MediaProjection status: ${MediaProjectionService.isRunning}")
        Log.i(TAG, "FloatingAnalyzerService status: ${MediaProjectionService.isRunning}")

        val knownBoomplayPackages = listOf(
            "com.afmobi.boomplayer",
            "com.boomplayer.app",
            "com.boomplay.music",
            "com.transsnet.boomplayer",
            "com.boomplay.lite",
            "com.transsion.boomplayer",
            "com.afmobi.boomplayer.intl",
            "com.boomplayer",
            "com.boomplay",
            "com.boomplay.music.lite"
        )

        var resolvedLaunchIntent: Intent? = null
        var detectedPkgName: String? = null
        var resolvedActivityName: String? = null

        // Strategy 1: Check known package names directly via PackageManager
        for (pkg in knownBoomplayPackages) {
            try {
                val launchIntent = packageManager.getLaunchIntentForPackage(pkg)
                if (launchIntent != null) {
                    detectedPkgName = pkg
                    resolvedLaunchIntent = launchIntent
                    resolvedActivityName = launchIntent.component?.className ?: "DefaultLaunchActivity"
                    Log.i(TAG, "Strategy 1 matched: detected Boomplay package name: $detectedPkgName, Activity: $resolvedActivityName")
                    break
                }
            } catch (e: Throwable) {
                Log.d(TAG, "Strategy 1 package check ($pkg) ignored: ${e.message}")
            }
        }

        // Strategy 2: Dynamically query all installed launcher activities matching 'boomplay' or 'boom'
        if (resolvedLaunchIntent == null) {
            try {
                val launcherQueryIntent = Intent(Intent.ACTION_MAIN, null).apply {
                    addCategory(Intent.CATEGORY_LAUNCHER)
                }
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PackageManager.MATCH_ALL else 0
                val resolveInfos = packageManager.queryIntentActivities(launcherQueryIntent, flags)
                Log.i(TAG, "Strategy 2: Total launcher activities found: ${resolveInfos.size}")

                for (info in resolveInfos) {
                    val pkg = info.activityInfo.packageName
                    val appLabel = try {
                        info.loadLabel(packageManager).toString()
                    } catch (e: Exception) {
                        ""
                    }
                    val lowerLabel = appLabel.lowercase()
                    val lowerPkg = pkg.lowercase()

                    if (lowerPkg.contains("boomplay") || lowerPkg.contains("boomplayer") || lowerPkg.contains("afmobi") ||
                        lowerLabel.contains("boomplay") || lowerLabel.contains("boom play") || lowerLabel.contains("boom player")) {
                        
                        detectedPkgName = pkg
                        resolvedActivityName = info.activityInfo.name
                        
                        // Try getLaunchIntentForPackage first
                        val directIntent = packageManager.getLaunchIntentForPackage(pkg)
                        if (directIntent != null) {
                            resolvedLaunchIntent = directIntent
                        } else {
                            // Construct explicit component launch intent
                            resolvedLaunchIntent = Intent(Intent.ACTION_MAIN).apply {
                                addCategory(Intent.CATEGORY_LAUNCHER)
                                component = ComponentName(pkg, info.activityInfo.name)
                                setFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
                            }
                        }
                        Log.i(TAG, "Strategy 2 matched! detected Boomplay package name: $detectedPkgName, resolved Activity: $resolvedActivityName, label: $appLabel")
                        break
                    }
                }
            } catch (e: Throwable) {
                Log.e(TAG, "Strategy 2 queryIntentActivities exception: ${e.message}", e)
            }
        }

        // Strategy 3: Check installed applications list
        if (resolvedLaunchIntent == null) {
            try {
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PackageManager.MATCH_ALL else 0
                val installedApps = packageManager.getInstalledApplications(flags)
                Log.i(TAG, "Strategy 3: Total installed applications found: ${installedApps.size}")

                for (app in installedApps) {
                    val pkg = app.packageName
                    val label = try {
                        packageManager.getApplicationLabel(app).toString()
                    } catch (e: Exception) {
                        ""
                    }
                    val lowerLabel = label.lowercase()
                    val lowerPkg = pkg.lowercase()

                    if (lowerPkg.contains("boomplay") || lowerPkg.contains("boomplayer") ||
                        lowerLabel.contains("boomplay") || lowerLabel.contains("boom play")) {
                        val launchIntent = packageManager.getLaunchIntentForPackage(pkg)
                        if (launchIntent != null) {
                            detectedPkgName = pkg
                            resolvedLaunchIntent = launchIntent
                            resolvedActivityName = launchIntent.component?.className ?: "ApplicationLaunchActivity"
                            Log.i(TAG, "Strategy 3 matched: detected Boomplay package name: $detectedPkgName, Activity: $resolvedActivityName")
                            break
                        }
                    }
                }
            } catch (e: Throwable) {
                Log.e(TAG, "Strategy 3 getInstalledApplications exception: ${e.message}", e)
            }
        }

        // Execute launch or display diagnostic error
        if (resolvedLaunchIntent != null && detectedPkgName != null) {
            try {
                resolvedLaunchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                Log.i(TAG, "resolved Boomplay Activity: $resolvedActivityName")
                Log.i(TAG, "launch Intent: $resolvedLaunchIntent")
                
                startActivity(resolvedLaunchIntent)
                
                Log.i(TAG, "launch success: true")
                Toast.makeText(this, "Launching Boomplay ($detectedPkgName)...", Toast.LENGTH_SHORT).show()
                statusText?.text = "🟢 Boomplay launched ($detectedPkgName)!\nFloating HUD remains active above the game."
            } catch (e: Throwable) {
                Log.e(TAG, "launch failure / exact exception: ${e.message}", e)
                showErrorDialog("Failed to launch Boomplay ($detectedPkgName):\n${e.javaClass.simpleName}: ${e.message}")
            }
        } else {
            Log.w(TAG, "Boomplay package detection failed. No match in installed applications.")
            val diagnosticMsg = "Could not automatically resolve the Boomplay launcher activity.\n\n" +
                    "• Package checked: com.afmobi.boomplayer, com.boomplay.music, etc.\n" +
                    "• If Boomplay is installed under a custom vendor name, you can switch to Boomplay from your home screen or recents menu.\n" +
                    "• The Football Analyzer HUD is ACTIVE and will continuously analyze the screen once Boomplay is visible."
            
            showErrorDialog(diagnosticMsg)
            statusText?.text = "⚠️ Boomplay launcher activity could not be resolved automatically.\n\nSwitch to Boomplay from your home screen — the floating HUD will stay active over the game."
        }
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun requestMediaProjection() {
        try {
            statusText?.text = "📱 Opening Screen Capture Permission Dialog...\nPlease tap 'Start now' / 'Entire screen' on the system dialog."
            Toast.makeText(this, "Opening screen capture prompt... Tap 'Start now'", Toast.LENGTH_SHORT).show()
            
            val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as? MediaProjectionManager
            if (projectionManager == null) {
                showErrorDialog("MediaProjectionManager is not available on this device.")
                return
            }

            val captureIntent = projectionManager.createScreenCaptureIntent()
            mediaProjectionLauncher.launch(captureIntent)
        } catch (e: Throwable) {
            Log.e(TAG, "Error requesting media projection", e)
            showErrorDialog("Unable to request screen capture: ${e.message}")
        }
    }

    private fun updateUIState() {
        try {
            val hasOverlay = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) Settings.canDrawOverlays(this) else true
            if (hasOverlay) {
                btnGrantOverlayPermission?.text = "Overlay Permission: GRANTED ✓"
                btnGrantOverlayPermission?.setBackgroundColor(0xFF3B82F6.toInt())
            } else {
                btnGrantOverlayPermission?.text = "Grant Overlay Permission"
                btnGrantOverlayPermission?.setBackgroundColor(0xFFE11D48.toInt())
            }

            if (MediaProjectionService.isRunning) {
                btnToggleOverlay?.text = "STOP LIVE SCREEN OBSERVER"
                btnToggleOverlay?.setBackgroundColor(0xFFEF4444.toInt()) // Red for Stop
                statusText?.text = "🟢 ACTIVE: Live screen observer & floating HUD running.\n\nTap 'OPEN BOOMPLAY FOOTBALL' below to switch directly to the game."
            } else {
                btnToggleOverlay?.text = "START LIVE SCREEN OBSERVER"
                btnToggleOverlay?.setBackgroundColor(0xFF10B981.toInt()) // Green for Start
                if (hasOverlay) {
                    statusText?.text = "Ready: Press 'START LIVE SCREEN OBSERVER' to launch the floating HUD above Boomplay."
                } else {
                    statusText?.text = "Required: Tap 'Grant Overlay Permission' first so the analyzer can float above Boomplay."
                }
            }
        } catch (e: Throwable) {
            Log.e(TAG, "Error updating UI state", e)
        }
    }

    private fun showErrorDialog(message: String) {
        try {
            statusText?.text = "⚠️ NOTICE:\n$message"
            AlertDialog.Builder(this)
                .setTitle("Football League Analyzer")
                .setMessage(message)
                .setPositiveButton("OK", null)
                .show()
        } catch (e: Exception) {
            Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        }
    }
}
