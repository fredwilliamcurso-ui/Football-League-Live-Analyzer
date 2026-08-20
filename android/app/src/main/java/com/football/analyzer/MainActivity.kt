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
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
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
        try {
            if (result.resultCode == Activity.RESULT_OK && result.data != null) {
                val serviceIntent = Intent(this, MediaProjectionService::class.java).apply {
                    putExtra("RESULT_CODE", result.resultCode)
                    putExtra("DATA_INTENT", result.data)
                }
                ContextCompat.startForegroundService(this, serviceIntent)
                Toast.makeText(this, "⚽ Football Analyzer HUD Active! Minimizing to reveal game...", Toast.LENGTH_SHORT).show()
                updateUIState()

                // Auto minimize so the floating HUD is visible over Boomplay / home screen
                Handler(Looper.getMainLooper()).postDelayed({
                    moveTaskToBack(true)
                }, 500)
            } else {
                Toast.makeText(this, "Screen capture permission required for live match analysis.", Toast.LENGTH_LONG).show()
                updateUIState()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting projection service", e)
            Toast.makeText(this, "Service start error: ${e.message}", Toast.LENGTH_LONG).show()
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
                requestOverlayPermission()
            }

            btnToggleOverlay?.setOnClickListener {
                if (MediaProjectionService.isRunning) {
                    // Stop service
                    stopService(Intent(this, MediaProjectionService::class.java))
                    Toast.makeText(this, "Live Screen Observer stopped.", Toast.LENGTH_SHORT).show()
                    updateUIState()
                    return@setOnClickListener
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                    Toast.makeText(this, "Please enable 'Display over other apps' first.", Toast.LENGTH_LONG).show()
                    requestOverlayPermission()
                    return@setOnClickListener
                }
                requestMediaProjection()
            }

            btnOpenBoomplay?.setOnClickListener {
                openBoomplayApp()
            }

            checkNotificationPermission()
            updateUIState()
        } catch (e: Throwable) {
            Log.e(TAG, "Fatal error inflating activity_main", e)
        }
    }

    override fun onResume() {
        super.onResume()
        updateUIState()
    }

    private fun openBoomplayApp() {
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
            // If not found by specific package, search apps with "Boomplay" in label
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
            } catch (e: Exception) {
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

    private fun requestOverlayPermission() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(this)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    )
                    startActivity(intent)
                } else {
                    Toast.makeText(this, "Overlay permission already granted ✓", Toast.LENGTH_SHORT).show()
                    updateUIState()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error opening overlay settings", e)
        }
    }

    private fun requestMediaProjection() {
        try {
            Toast.makeText(this, "Opening screen capture prompt... Tap 'Start now' / 'Entire screen'", Toast.LENGTH_SHORT).show()
            val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            mediaProjectionLauncher.launch(projectionManager.createScreenCaptureIntent())
        } catch (e: Exception) {
            Log.e(TAG, "Error creating screen capture intent", e)
            Toast.makeText(this, "Unable to request screen capture: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun updateUIState() {
        try {
            val hasOverlay = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) Settings.canDrawOverlays(this) else true
            if (hasOverlay) {
                btnGrantOverlayPermission?.isEnabled = false
                btnGrantOverlayPermission?.text = "Overlay Permission: GRANTED ✓"
                btnGrantOverlayPermission?.setBackgroundColor(0xFF3B82F6.toInt())
            } else {
                btnGrantOverlayPermission?.isEnabled = true
                btnGrantOverlayPermission?.text = "Grant Overlay Permission"
                btnGrantOverlayPermission?.setBackgroundColor(0xFFE11D48.toInt())
            }

            if (MediaProjectionService.isRunning) {
                btnToggleOverlay?.text = "STOP LIVE SCREEN OBSERVER"
                btnToggleOverlay?.setBackgroundColor(0xFFEF4444.toInt()) // Red for Stop
                statusText?.text = "🟢 ACTIVE: Live screen observer & floating HUD running over apps.\n\nTap 'OPEN BOOMPLAY FOOTBALL' below to switch to the game."
            } else {
                btnToggleOverlay?.text = "START LIVE SCREEN OBSERVER"
                btnToggleOverlay?.setBackgroundColor(0xFF10B981.toInt()) // Green for Start
                if (hasOverlay) {
                    statusText?.text = "Ready: Press 'START LIVE SCREEN OBSERVER' to launch the floating HUD above Boomplay."
                } else {
                    statusText?.text = "Required: Tap 'Grant Overlay Permission' first so the analyzer can float above Boomplay."
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error updating UI state", e)
        }
    }
}

