package com.football.analyzer

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.football.analyzer.capture.MediaProjectionService
import com.football.analyzer.overlay.FloatingAnalyzerService

class MainActivity : AppCompatActivity() {

    private lateinit var statusText: TextView
    private lateinit var btnToggleOverlay: Button
    private lateinit var btnGrantOverlayPermission: Button

    private val mediaProjectionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
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
            Toast.makeText(this, "Screen capture permission is required for live game analysis.", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusText = findViewById(R.id.textStatus)
        btnToggleOverlay = findViewById(R.id.btnToggleOverlay)
        btnGrantOverlayPermission = findViewById(R.id.btnGrantOverlayPermission)

        btnGrantOverlayPermission.setOnClickListener {
            requestOverlayPermission()
        }

        btnToggleOverlay.setOnClickListener {
            if (!Settings.canDrawOverlays(this)) {
                requestOverlayPermission()
                return@setOnClickListener
            }
            requestMediaProjection()
        }
    }

    override fun onResume() {
        super.onResume()
        updateUIState()
    }

    private fun requestOverlayPermission() {
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

    private fun requestMediaProjection() {
        val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjectionLauncher.launch(projectionManager.createScreenCaptureIntent())
    }

    private fun startFloatingOverlayService() {
        val overlayIntent = Intent(this, FloatingAnalyzerService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(overlayIntent)
        } else {
            startService(overlayIntent)
        }
    }

    private fun updateUIState() {
        val hasOverlay = Settings.canDrawOverlays(this)
        if (hasOverlay) {
            btnGrantOverlayPermission.isEnabled = false
            btnGrantOverlayPermission.text = "Overlay Permission: GRANTED"
            statusText.text = "Ready to start Live Football Analyzer overlay."
        } else {
            btnGrantOverlayPermission.isEnabled = true
            btnGrantOverlayPermission.text = "Grant Overlay Permission"
            statusText.text = "Overlay permission required to display HUD above Boomplay."
        }
    }
}
