// Top-level build file — plugin versions are declared here (with apply false)
// and applied per-module in app/build.gradle.kts. This keeps Android Gradle
// Plugin / Kotlin / Compose-compiler versions in exactly one place.
plugins {
    id("com.android.application") version "9.2.1" apply false
    id("org.jetbrains.kotlin.android") version "2.2.10" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.2.10" apply false
    id("org.jetbrains.kotlin.plugin.serialization") version "2.0.20" apply false
}
