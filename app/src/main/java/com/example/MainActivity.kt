package com.example

import android.app.AlertDialog
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
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.SlateDarkBg

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
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
}

@Composable
fun WebViewContainer() {
    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                webViewClient = WebViewClient()
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

