package com.football.analyzer

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.football.analyzer.capture.MediaProjectionService
import com.football.analyzer.overlay.FloatingAnalyzerService

class MainActivity : AppCompatActivity() {

    private val TAG = "MainActivity"
    private var statusText: TextView? = null
    private var btnToggleOverlay: Button? = null
    private var btnGrantOverlayPermission: Button? = null

    private val mediaProjectionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        try {
            if (result.resultCode == Activity.RESULT_OK && result.data != null) {
                val serviceIntent = Intent(this, MediaProjectionService::class.java).apply {
                    putExtra("RESULT_CODE", result.resultCode)
                    putExtra("DATA_INTENT", result.data)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(serviceIntent)
                } else {
                    startService(serviceIntent)
                }
                startFloatingOverlayService()
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
            updateUIState()
        } catch (e: Throwable) {
            Log.e(TAG, "Fatal error inflating activity_main", e)
            // Fallback emergency UI to guarantee screen opens
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

    private fun startFloatingOverlayService() {
        try {
            val overlayIntent = Intent(this, FloatingAnalyzerService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(overlayIntent)
            } else {
                startService(overlayIntent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error starting overlay service", e)
        }
    }

    private fun updateUIState() {
        try {
            val hasOverlay = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) Settings.canDrawOverlays(this) else true
            if (hasOverlay) {
                btnGrantOverlayPermission?.isEnabled = false
                btnGrantOverlayPermission?.text = "Overlay Permission: GRANTED"
                statusText?.text = "Ready to start Live Football Analyzer overlay."
            } else {
                btnGrantOverlayPermission?.isEnabled = true
                btnGrantOverlayPermission?.text = "Grant Overlay Permission"
                statusText?.text = "Overlay permission required to display HUD above game."
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error updating UI state", e)
        }
    }
}

