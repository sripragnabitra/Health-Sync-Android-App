package com.independenceos.healthsync.ui.permission

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.independenceos.healthsync.healthconnect.HealthConnectAvailability

@Composable
fun PermissionScreen(
    viewModel: PermissionViewModel,
    onPermissionsGranted: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(contract = viewModel.permissionRequestContract()) {
        viewModel.refresh()
    }

    LaunchedEffect(uiState.allPermissionsGranted) {
        if (uiState.allPermissionsGranted) onPermissionsGranted()
    }

    Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Connect your health data", style = MaterialTheme.typography.headlineSmall, textAlign = TextAlign.Center)
            Spacer(Modifier.height(12.dp))

            when (uiState.availability) {
                is HealthConnectAvailability.Available -> {
                    Text(
                        "Health Sync reads your steps, distance, active calories, heart rate, and sleep from Health Connect to keep your dashboard up to date. It never writes or shares this data with anyone but your own account.",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.height(24.dp))
                    Button(onClick = { permissionLauncher.launch(viewModel.requiredPermissions) }) {
                        Text("Grant permissions")
                    }
                }
                is HealthConnectAvailability.NotInstalled -> {
                    Text(
                        "Health Sync needs the Health Connect app to read your health data. Install it, then come back here.",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.height(24.dp))
                    Button(onClick = { context.openHealthConnectPlayStoreListing() }) {
                        Text("Install Health Connect")
                    }
                    Spacer(Modifier.height(8.dp))
                    TextButton(onClick = { viewModel.refresh() }) { Text("I've installed it — check again") }
                }
                is HealthConnectAvailability.UpdateRequired -> {
                    Text(
                        "Your device's Health Connect needs an update before Health Sync can use it.",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(Modifier.height(24.dp))
                    Button(onClick = { context.openHealthConnectPlayStoreListing() }) {
                        Text("Update Health Connect")
                    }
                }
            }
        }
    }
}

/** The documented deep link for prompting a Health Connect install/update from Play Store, with onboarding context attached. */
private fun android.content.Context.openHealthConnectPlayStoreListing() {
    val uri = Uri.parse("market://details?id=com.google.android.apps.healthdata&url=healthconnect%3A%2F%2Fonboarding")
    val intent = Intent(Intent.ACTION_VIEW, uri).apply {
        setPackage("com.android.vending")
        putExtra("overlay", true)
        putExtra("callerId", packageName)
    }
    runCatching { startActivity(intent) }
}
