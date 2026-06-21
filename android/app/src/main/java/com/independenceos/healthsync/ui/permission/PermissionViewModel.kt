package com.independenceos.healthsync.ui.permission

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.independenceos.healthsync.healthconnect.HealthConnectAvailability
import com.independenceos.healthsync.healthconnect.HealthConnectManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PermissionUiState(
    val availability: HealthConnectAvailability = HealthConnectAvailability.Available,
    val allPermissionsGranted: Boolean = false,
    val isChecking: Boolean = true,
)

class PermissionViewModel(private val healthConnectManager: HealthConnectManager) : ViewModel() {

    private val _uiState = MutableStateFlow(PermissionUiState())
    val uiState: StateFlow<PermissionUiState> = _uiState.asStateFlow()

    val requiredPermissions: Set<String> = healthConnectManager.requiredPermissions
    fun permissionRequestContract() = healthConnectManager.permissionRequestContract()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isChecking = true)
            val availability = healthConnectManager.availability()
            val granted = if (availability is HealthConnectAvailability.Available) {
                healthConnectManager.hasAllRequiredPermissions()
            } else {
                false
            }
            _uiState.value = PermissionUiState(availability = availability, allPermissionsGranted = granted, isChecking = false)
        }
    }
}
