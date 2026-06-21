package com.independenceos.healthsync

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.independenceos.healthsync.healthconnect.HealthConnectAvailability
import com.independenceos.healthsync.ui.navigation.HealthSyncNavHost
import com.independenceos.healthsync.ui.navigation.Routes
import com.independenceos.healthsync.ui.theme.HealthSyncTheme
import kotlinx.coroutines.flow.first

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val container = (application as HealthSyncApplication).container

        setContent {
            HealthSyncTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    var startDestination by remember { mutableStateOf<String?>(null) }

                    LaunchedEffect(Unit) {
                        val loggedIn = container.authRepository.isLoggedIn.first()
                        val permissionsOk = container.healthConnectManager.availability() is HealthConnectAvailability.Available &&
                            container.healthConnectManager.hasAllRequiredPermissions()

                        startDestination = when {
                            !loggedIn -> Routes.LOGIN
                            !permissionsOk -> Routes.PERMISSION
                            else -> Routes.DASHBOARD
                        }
                    }

                    val destination = startDestination
                    if (destination == null) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    } else {
                        HealthSyncNavHost(container = container, startDestination = destination)
                    }
                }
            }
        }
    }
}
