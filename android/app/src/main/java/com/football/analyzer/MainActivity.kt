package com.football.analyzer

import android.Manifest
import android.app.Activity
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
        val boomplayPackages = listOf(
            "com.afmobi.boomplayer",
            "com.boomplay.music",
            "com.boomplayer.app"
        )
        var launched = false
        for (pkg in boomplayPackages) {
            val launchIntent = packageManager.getLaunchIntentForPackage(pkg)
            if (launchIntent != null) {
                startActivity(launchIntent)
                launched = true
                break
            }
        }
        if (!launched) {
            try {
                val intent = Intent(Intent.ACTION_MAIN, null).apply {
                    addCategory(Intent.CATEGORY_LAUNCHER)
                }
                val apps = packageManager.queryIntentActivities(intent, 0)
                for (app in apps) {
                    val label = app.loadLabel(packageManager).toString().lowercase()
                    if (label.contains("boomplay")) {
                        val launchIntent = packageManager.getLaunchIntentForPackage(app.activityInfo.packageName)
                        if (launchIntent != null) {
                            startActivity(launchIntent)
                            launched = true
                            break
                        }
                    }
                }
            } catch (e: Throwable) {
                Log.e(TAG, "Error querying apps", e)
            }
        }

        if (!launched) {
            Toast.makeText(this, "Boomplay app not found directly. Please open Boomplay from your home screen.", Toast.LENGTH_LONG).show()
            moveTaskToBack(true)
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
            statusText?.text = "⚠️ ERROR: $message"
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
