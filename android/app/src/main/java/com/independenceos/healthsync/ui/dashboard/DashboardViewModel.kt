package com.independenceos.healthsync.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.independenceos.healthsync.data.remote.dto.SyncJobDto
import com.independenceos.healthsync.data.repository.AuthRepository
import com.independenceos.healthsync.data.repository.SyncRepository
import com.independenceos.healthsync.domain.SyncOutcome
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * The date range options the user can pick from before syncing.
 * [label] is what's shown in the UI chip/button.
 * [days] is how many days back from now to read from Health Connect.
 */
enum class DateRangeOption(val label: String, val days: Long) {
    LAST_7_DAYS("Last 7 days", 7L),
    LAST_14_DAYS("Last 14 days", 14L),
    LAST_30_DAYS("Last 30 days", 30L),
    LAST_60_DAYS("Last 60 days", 60L),
    LAST_90_DAYS("Last 90 days", 90L),
}

data class DashboardUiState(
    val outcome: SyncOutcome = SyncOutcome.Idle,
    val lastSuccessfulSyncAt: String? = null,
    val recentJobs: List<SyncJobDto> = emptyList(),
    val isLoadingStatus: Boolean = true,
    val selectedRange: DateRangeOption = DateRangeOption.LAST_7_DAYS,
)

class DashboardViewModel(
    private val syncRepository: SyncRepository,
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        refreshStatus()
    }

    fun onRangeSelected(range: DateRangeOption) {
        _uiState.value = _uiState.value.copy(selectedRange = range)
    }

    fun refreshStatus() {
        viewModelScope.launch {
            syncRepository.getSyncStatus()
                .onSuccess { status ->
                    _uiState.value = _uiState.value.copy(
                        lastSuccessfulSyncAt = status.lastSuccessfulSyncAt,
                        recentJobs = status.recentJobs,
                        isLoadingStatus = false,
                    )
                }
                .onFailure {
                    _uiState.value = _uiState.value.copy(isLoadingStatus = false)
                }
        }
    }

    fun sync(trigger: String = "MANUAL") {
        if (_uiState.value.outcome is SyncOutcome.InProgress) return
        val days = _uiState.value.selectedRange.days

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(outcome = SyncOutcome.InProgress)
            val outcome = syncRepository.performSync(trigger = trigger, lookbackDays = days)
            _uiState.value = _uiState.value.copy(outcome = outcome)
            refreshStatus()
        }
    }

    fun logout(onLoggedOut: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            onLoggedOut()
        }
    }
}
