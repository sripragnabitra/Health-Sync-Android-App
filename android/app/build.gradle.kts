plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "com.independenceos.healthsync"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.independenceos.healthsync"
        // Health Connect's client library supports API 26+, but the
        // permission rationale / availability-check flow used here targets
        // the modern (Android 14+, where Health Connect ships in the OS)
        // path most cleanly. On API 26-33 devices, the user additionally
        // needs the standalone "Health Connect" app from Play Store —
        // see HealthConnectManager.isAvailable().
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        // PRODUCTION: set this to your deployed Railway backend URL after
        // following docs/DEPLOYMENT.md — e.g.
        // "https://healthsync-api-production.up.railway.app/api/v1/"
        // This is what lets the app work standalone on any phone, with no
        // WiFi/IP configuration needed by whoever installs it.
        buildConfigField("String", "API_BASE_URL", "\"https://health-sync-android-app-production.up.railway.app/api/v1/\"")
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.4")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.4")
    implementation("androidx.activity:activity-compose:1.9.1")

    // Compose
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.navigation:navigation-compose:2.7.7")
    debugImplementation("androidx.compose.ui:ui-tooling")

    // Health Connect — check Google's Maven for the current stable version;
    // 1.1.0 was the latest stable release as of this writing.
    implementation("androidx.health.connect:connect-client:1.1.0")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.1")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Local persistence (JWT, clientDeviceId, lastSyncTime)
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Background periodic sync (in addition to the in-app manual sync button)
    implementation("androidx.work:work-runtime-ktx:2.9.1")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}
