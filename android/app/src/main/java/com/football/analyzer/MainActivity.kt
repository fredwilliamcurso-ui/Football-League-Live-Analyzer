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
                Toast.makeText(this, "⚽ Football Analyzer HUD Started!", Toast.LENGTH_SHORT).show()
                updateUIState()
            } else {
                Toast.makeText(this, "Screen capture permission required for live match analysis.", Toast.LENGTH_SHORT).show()
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

            btnGrantOverlayPermission?.setOnClickListener {
                requestOverlayPermission()
            }

            btnToggleOverlay?.setOnClickListener {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                    requestOverlayPermission()
                    return@setOnClickListener
                }
                requestMediaProjection()
            }

            checkNotificationPermission()
            updateUIState()
        } catch (e: Throwable) {
            Log.e(TAG, "Fatal error inflating activity_main", e)
            // Emergency fallback UI
            val fallbackLayout = android.widget.LinearLayout(this).apply {
                orientation = android.widget.LinearLayout.VERTICAL
                setPadding(48, 96, 48, 48)
                setBackgroundColor(0xFF0F172A.toInt())
            }
            val titleView = TextView(this).apply {
                text = "⚽ Football League Live Analyzer"
                textSize = 20f
                setTextColor(0xFFFFFFFF.toInt())
            }
            val btn = Button(this).apply {
                text = "Start Floating HUD Overlay"
                setBackgroundColor(0xFF10B981.toInt())
                setTextColor(0xFFFFFFFF.toInt())
                setOnClickListener {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this@MainActivity)) {
                        requestOverlayPermission()
                    } else {
                        requestMediaProjection()
                    }
                }
            }
            fallbackLayout.addView(titleView)
            fallbackLayout.addView(btn)
            setContentView(fallbackLayout)
        }
    }

    override fun onResume() {
        super.onResume()
        updateUIState()
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
                    Toast.makeText(this, "Overlay permission already granted", Toast.LENGTH_SHORT).show()
                    updateUIState()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error opening overlay settings", e)
        }
    }

    private fun requestMediaProjection() {
        try {
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
                statusText?.text = "Ready: Press 'Start Live Screen Observer' to launch HUD above Boomplay."
            } else {
                btnGrantOverlayPermission?.isEnabled = true
                btnGrantOverlayPermission?.text = "Grant Overlay Permission"
                statusText?.text = "Required: Grant Overlay permission to display HUD floating above Boomplay."
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error updating UI state", e)
        }
    }
}

