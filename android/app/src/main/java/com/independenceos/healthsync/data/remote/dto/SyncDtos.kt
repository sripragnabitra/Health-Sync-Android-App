package com.independenceos.healthsync.data.remote.dto

import com.independenceos.healthsync.domain.ParameterType
import kotlinx.serialization.Serializable

/**
 * Wire format for one reading. Notably absent: `unit` — the backend is the
 * single source of truth for units (see backend/src/core/types.ts), so
 * this client never sends one. See HealthDataMapper for where
 * sourceRecordId/localDate are actually computed.
 */
@Serializable
data class HealthRecordDto(
    val sourceRecordId: String,
    val parameterType: ParameterType,
    val value: Double,
    val recordedAt: String, // ISO-8601 instant
    val recordedEndAt: String? = null,
    val localDate: String, // YYYY-MM-DD
)

@Serializable
data class IngestRequest(
    val deviceId: String,
    val trigger: String, // "MANUAL" | "SCHEDULED"
    val records: List<HealthRecordDto>,
)

@Serializable
data class IngestResponseDto(
    val syncJobId: String,
    val status: String,
    val recordsReceived: Int,
    val recordsInserted: Int,
    val recordsSkippedAsDuplicate: Int,
    val daysRecalculated: Int,
)
