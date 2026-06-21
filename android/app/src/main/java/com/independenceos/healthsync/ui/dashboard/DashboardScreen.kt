package com.independenceos.healthsync.ui.dashboard

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.independenceos.healthsync.data.remote.dto.SyncJobDto
import com.independenceos.healthsync.domain.SyncOutcome

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    onLoggedOut: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Health Sync") },
                actions = {
                    IconButton(onClick = { viewModel.logout(onLoggedOut) }) {
                        Icon(Icons.Filled.Logout, contentDescription = "Sign out")
                    }
                },
            )
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(vertical = 20.dp),
        ) {
            // ── Date range picker ──────────────────────────────────────────
            item {
                DateRangePicker(
                    selected = uiState.selectedRange,
                    onSelect = viewModel::onRangeSelected,
                    enabled = uiState.outcome !is SyncOutcome.InProgress,
                )
            }

            // ── Sync status card ───────────────────────────────────────────
            item {
                SyncStatusCard(
                    uiState = uiState,
                    onSyncClick = { viewModel.sync("MANUAL") },
                )
            }

            // ── Recent syncs ───────────────────────────────────────────────
            item {
                Text("Recent syncs", style = MaterialTheme.typography.titleMedium)
            }

            if (uiState.recentJobs.isEmpty()) {
                item {
                    Text(
                        "No syncs yet — pick a date range above and tap Sync Now.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            } else {
                items(uiState.recentJobs) { job -> SyncJobRow(job) }
            }
        }
    }
}

// ── Date range picker ──────────────────────────────────────────────────────────

@Composable
private fun DateRangePicker(
    selected: DateRangeOption,
    onSelect: (DateRangeOption) -> Unit,
    enabled: Boolean,
) {
    Column {
        Text(
            "Select date range to sync",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(8.dp))

        // Scrollable row of chips so all 5 options fit on any screen width
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            DateRangeOption.entries.forEach { option ->
                FilterChip(
                    selected = option == selected,
                    onClick = { if (enabled) onSelect(option) },
                    label = { Text(option.label) },
                    enabled = enabled,
                )
            }
        }

        Spacer(Modifier.height(4.dp))
        Text(
            "Health Connect data from the last ${selected.days} days will be read and uploaded.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

// ── Sync status card ───────────────────────────────────────────────────────────

@Composable
private fun SyncStatusCard(uiState: DashboardUiState, onSyncClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                StatusIcon(uiState.outcome)
                Spacer(Modifier.width(8.dp))
                Text(statusLabel(uiState.outcome), style = MaterialTheme.typography.titleMedium)
            }

            Spacer(Modifier.height(4.dp))
            Text(
                "Last successful sync: ${uiState.lastSuccessfulSyncAt?.let { formatRelative(it) } ?: "Never"}",
                style = MaterialTheme.typography.bodyMedium,
            )

            if (uiState.outcome is SyncOutcome.Success) {
                Spacer(Modifier.height(4.dp))
                Text(
                    "${uiState.outcome.recordsInserted} new readings uploaded" +
                        if (uiState.outcome.recordsSkippedAsDuplicate > 0)
                            " · ${uiState.outcome.recordsSkippedAsDuplicate} already synced"
                        else "",
                    style = MaterialTheme.typography.bodyMedium,
                )
            }

            if (uiState.outcome is SyncOutcome.Failure) {
                Spacer(Modifier.height(4.dp))
                Text(
                    uiState.outcome.message,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }

            Spacer(Modifier.height(16.dp))
            Button(
                onClick = onSyncClick,
                enabled = uiState.outcome !is SyncOutcome.InProgress,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (uiState.outcome is SyncOutcome.InProgress) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary,
                    )
                    Spacer(Modifier.width(8.dp))
                }
                Text(
                    if (uiState.outcome is SyncOutcome.InProgress)
                        "Syncing ${uiState.selectedRange.label}…"
                    else
                        "Sync Now  ·  ${uiState.selectedRange.label}"
                )
            }
        }
    }
}

// ── Recent sync row ────────────────────────────────────────────────────────────

@Composable
private fun SyncJobRow(job: SyncJobDto) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(job.status, style = MaterialTheme.typography.bodyLarge)
            Text(
                "${job.recordsInserted} inserted · ${job.recordsSkipped} already synced",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Text(
            formatRelative(job.startedAt),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
    HorizontalDivider()
}

// ── Helpers ────────────────────────────────────────────────────────────────────

@Composable
private fun StatusIcon(outcome: SyncOutcome) {
    when (outcome) {
        is SyncOutcome.Success ->
            Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
        is SyncOutcome.Failure ->
            Icon(Icons.Filled.Error, contentDescription = null, tint = MaterialTheme.colorScheme.error)
        is SyncOutcome.InProgress ->
            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
        is SyncOutcome.Idle ->
            Icon(Icons.Filled.Sync, contentDescription = null)
    }
}

private fun statusLabel(outcome: SyncOutcome): String = when (outcome) {
    is SyncOutcome.Success -> "Up to date"
    is SyncOutcome.Failure -> "Sync failed"
    is SyncOutcome.InProgress -> "Syncing…"
    is SyncOutcome.Idle -> "Ready to sync"
}

private fun formatRelative(iso: String): String = runCatching {
    val then = java.time.Instant.parse(iso)
    val minutes = java.time.Duration.between(then, java.time.Instant.now()).toMinutes()
    when {
        minutes < 1 -> "Just now"
        minutes < 60 -> "$minutes min ago"
        minutes < 60 * 24 -> "${minutes / 60} hr ago"
        else -> "${minutes / (60 * 24)} day ago"
    }
}.getOrDefault(iso)
