package com.independenceos.healthsync.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/**
 * Mirrors the web dashboard's three-typeface system (serif display / sans
 * body / mono data) using Compose's built-in generic font families rather
 * than bundling the exact Libre Baskerville / IBM Plex TTFs. Pulling in
 * the real brand fonts would mean either shipping font files as resources
 * (not practical to author as binary blobs here) or wiring up the
 * Downloadable Fonts API, which needs a Google Fonts provider certificate
 * hash — getting that hash wrong fails silently at runtime in a way that's
 * hard to debug without a real device to test on, so it's not a risk worth
 * taking sight-unseen. Swapping in the real families later is a Type.kt-only change.
 */
private val DisplayFont = FontFamily.Serif
private val BodyFont = FontFamily.Default
val DataFont = FontFamily.Monospace

val HealthSyncTypography = Typography(
    headlineSmall = TextStyle(fontFamily = DisplayFont, fontWeight = FontWeight.Normal, fontSize = 24.sp),
    titleLarge = TextStyle(fontFamily = DisplayFont, fontWeight = FontWeight.Normal, fontSize = 20.sp),
    titleMedium = TextStyle(fontFamily = BodyFont, fontWeight = FontWeight.SemiBold, fontSize = 16.sp),
    bodyLarge = TextStyle(fontFamily = BodyFont, fontWeight = FontWeight.Normal, fontSize = 15.sp),
    bodyMedium = TextStyle(fontFamily = BodyFont, fontWeight = FontWeight.Normal, fontSize = 14.sp),
    labelLarge = TextStyle(fontFamily = BodyFont, fontWeight = FontWeight.SemiBold, fontSize = 13.sp),
    labelMedium = TextStyle(
        fontFamily = BodyFont,
        fontWeight = FontWeight.Bold,
        fontSize = 11.sp,
        letterSpacing = 1.2.sp,
    ),
)
