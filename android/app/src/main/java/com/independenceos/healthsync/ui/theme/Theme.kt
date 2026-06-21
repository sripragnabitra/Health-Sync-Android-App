package com.independenceos.healthsync.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

/**
 * Light scheme only for now — the brand palette this mirrors (see
 * docs/ASSUMPTIONS.md) is a light, cream-and-iris design without a defined
 * dark variant. Respecting system dark mode would mean inventing a dark
 * palette that doesn't exist anywhere else in this design system; better
 * to ship one deliberate look than an undefined-looking dark mode.
 */
private val LightColors = lightColorScheme(
    primary = Ink,
    onPrimary = InkOnDark,
    secondary = Amber,
    onSecondary = InkOnDark,
    background = Bg,
    onBackground = Ink2,
    surface = Surface,
    onSurface = Ink2,
    surfaceVariant = SurfaceMuted,
    onSurfaceVariant = InkMuted,
    outline = Border,
    error = DenialFg,
    errorContainer = DenialBg,
)

@Composable
fun HealthSyncTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        typography = HealthSyncTypography,
        content = content,
    )
}
