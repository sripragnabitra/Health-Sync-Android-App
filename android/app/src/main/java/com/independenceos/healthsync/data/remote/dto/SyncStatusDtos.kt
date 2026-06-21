package com.independenceos.healthsync.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class SyncJobDto(
    val id: String,
    val status: String,
    val trigger: String,
    val recordsReceived: Int,
    val recordsInserted: Int,
    val recordsSkipped: Int,
    val startedAt: String,
    val completedAt: String? = null,
)

@Serializable
data class SyncStatusResponseDto(
    val latestJob: SyncJobDto?,
    val lastSuccessfulSyncAt: String?,
    val recentJobs: List<SyncJobDto>,
)
