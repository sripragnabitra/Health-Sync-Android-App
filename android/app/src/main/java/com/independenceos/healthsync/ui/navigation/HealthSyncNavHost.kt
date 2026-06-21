package com.independenceos.healthsync.ui.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.independenceos.healthsync.di.AppContainer
import com.independenceos.healthsync.ui.dashboard.DashboardScreen
import com.independenceos.healthsync.ui.dashboard.DashboardViewModel
import com.independenceos.healthsync.ui.login.LoginScreen
import com.independenceos.healthsync.ui.login.LoginViewModel
import com.independenceos.healthsync.ui.permission.PermissionScreen
import com.independenceos.healthsync.ui.permission.PermissionViewModel

object Routes {
    const val PERMISSION = "permission"
    const val LOGIN = "login"
    const val DASHBOARD = "dashboard"
}

@Composable
fun HealthSyncNavHost(container: AppContainer, startDestination: String) {
    val navController: NavHostController = rememberNavController()

    NavHost(navController = navController, startDestination = startDestination) {
        composable(Routes.PERMISSION) {
            val vm: PermissionViewModel = viewModel(
                factory = viewModelFactory { initializer { PermissionViewModel(container.healthConnectManager) } }
            )
            PermissionScreen(
                viewModel = vm,
                onPermissionsGranted = {
                    navController.navigate(Routes.DASHBOARD) { popUpTo(Routes.PERMISSION) { inclusive = true } }
                },
            )
        }

        composable(Routes.LOGIN) {
            val vm: LoginViewModel = viewModel(
                factory = viewModelFactory { initializer { LoginViewModel(container.authRepository) } }
            )
            LoginScreen(
                viewModel = vm,
                onLoggedIn = {
                    navController.navigate(Routes.PERMISSION) { popUpTo(Routes.LOGIN) { inclusive = true } }
                },
            )
        }

        composable(Routes.DASHBOARD) {
            val vm: DashboardViewModel = viewModel(
                factory = viewModelFactory { initializer { DashboardViewModel(container.syncRepository, container.authRepository) } }
            )
            DashboardScreen(
                viewModel = vm,
                onLoggedOut = {
                    navController.navigate(Routes.LOGIN) { popUpTo(0) { inclusive = true } }
                },
            )
        }
    }
}
