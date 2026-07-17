package com.example

import android.Manifest
import android.app.AlertDialog
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.JsResult
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.SlateDarkBg

class MainActivity : ComponentActivity() {

    private val CHANNEL_ID = "selvix_notifications_channel"
    private val NOTIFICATION_ID = 4812
    private val PERMISSION_REQUEST_CODE = 101

    private var webView: WebView? = null
    private var pendingNavigation = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Create Notification Channel
        createNotificationChannel()

        // Check if opened from notification click
        handleIntent(intent)

        // Request permissions
        requestAppPermissions()

        // Trigger notification when app opens
        triggerLaunchNotification()

        setContent {
            MyApplicationTheme {
                Surface(
                    modifier = Modifier.fillMaxSize().safeDrawingPadding(),
                    color = SlateDarkBg
                ) {
                    WebViewContainer()
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
        if (pendingNavigation) {
            triggerWebViewNavigation()
        }
    }

    private fun handleIntent(intent: Intent?) {
        if (intent != null && intent.getBooleanExtra("open_messages", false)) {
            pendingNavigation = true
        }
    }

    private fun triggerWebViewNavigation() {
        webView?.let { view ->
            view.post {
                view.evaluateJavascript("if (typeof window.navigateToMessages === 'function') { window.navigateToMessages(); }", null)
                pendingNavigation = false
            }
        }
    }

    private fun requestAppPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.WRITE_CONTACTS,
            Manifest.permission.READ_CALENDAR,
            Manifest.permission.WRITE_CALENDAR,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.CALL_PHONE
        )

        // Android 13+ needs explicit notification permission
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val ungranted = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (ungranted.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, ungranted.toTypedArray(), PERMISSION_REQUEST_CODE)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Selvix Game Zone Arifa"
            val descriptionText = "Arifa za Selvix na ujumbe wa michezo"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
            }
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun triggerLaunchNotification() {
        // Build notification intent
        val clickIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("open_messages", true)
        }

        // Flags for PendingIntent: FLAG_IMMUTABLE is required for newer Android versions,
        // but since we want to pass extras, we use FLAG_MUTABLE or FLAG_UPDATE_CURRENT
        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            clickIntent,
            pendingIntentFlags
        )

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Standard fallback icon
            .setContentTitle("Selvix Game Zone 🎮")
            .setContentText("Karibu tena! Una ujumbe mpya na ofa za michezo. Bofya hapa kusoma.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
            ) {
                with(NotificationManagerCompat.from(this)) {
                    notify(NOTIFICATION_ID, builder.build())
                }
            }
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }

    @Composable
    fun WebViewContainer() {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                WebView(context).apply {
                    this@MainActivity.webView = this
                    webViewClient = object : WebViewClient() {
                        override fun onPageFinished(view: WebView?, url: String?) {
                            super.onPageFinished(view, url)
                            if (pendingNavigation) {
                                triggerWebViewNavigation()
                            }
                        }
                    }
                    webChromeClient = object : WebChromeClient() {
                        override fun onJsAlert(
                            view: WebView?,
                            url: String?,
                            message: String?,
                            result: JsResult?
                        ): Boolean {
                            AlertDialog.Builder(context)
                                .setTitle("Selvix Game Zone")
                                .setMessage(message)
                                .setPositiveButton(android.R.string.ok) { _, _ ->
                                    result?.confirm()
                                }
                                .setCancelable(false)
                                .create()
                                .show()
                            return true
                        }

                        override fun onJsConfirm(
                            view: WebView?,
                            url: String?,
                            message: String?,
                            result: JsResult?
                        ): Boolean {
                            AlertDialog.Builder(context)
                                .setTitle("Selvix Game Zone")
                                .setMessage(message)
                                .setPositiveButton(android.R.string.ok) { _, _ ->
                                    result?.confirm()
                                }
                                .setNegativeButton(android.R.string.cancel) { _, _ ->
                                    result?.cancel()
                                }
                                .setCancelable(false)
                                .create()
                                .show()
                            return true
                        }
                    }
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        databaseEnabled = true
                        allowFileAccess = true
                        allowContentAccess = true
                        allowFileAccessFromFileURLs = true
                        allowUniversalAccessFromFileURLs = true
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    }
                    loadUrl("file:///android_asset/index.html")
                }
            }
        )
    }
}
