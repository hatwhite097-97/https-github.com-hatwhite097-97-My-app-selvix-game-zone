package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = CrimsonRed,
    secondary = RedDark,
    tertiary = AccentRed,
    background = SlateDarkBg,
    surface = SlateDarkSurface,
    onBackground = TextWhite,
    onSurface = TextWhite,
    surfaceVariant = SlateDarkSurfaceVariant,
    onSurfaceVariant = TextGray
)

private val LightColorScheme = darkColorScheme(
    primary = CrimsonRed,
    secondary = RedDark,
    tertiary = AccentRed,
    background = SlateDarkBg,
    surface = SlateDarkSurface,
    onBackground = TextWhite,
    onSurface = TextWhite,
    surfaceVariant = SlateDarkSurfaceVariant,
    onSurfaceVariant = TextGray
)

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = true, // Force dark theme for the game zone experience
  dynamicColor: Boolean = false, // Use our consistent brand identity colors
  content: @Composable () -> Unit,
) {
  val colorScheme =
    when {
      dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
        val context = LocalContext.current
        if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      }

      darkTheme -> DarkColorScheme
      else -> LightColorScheme
    }

  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
