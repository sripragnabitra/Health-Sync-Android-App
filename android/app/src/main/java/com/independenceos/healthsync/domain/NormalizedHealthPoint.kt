package com.independenceos.healthsync.domain

import java.time.Instant
import java.time.LocalDate

/**
 * One normalized reading, already mapped out of whatever Health Connect
 * record type it came from. This is the boundary between
 * "Health Connect's data model" and "this app's/the backend's data model" —
 * everything downstream of HealthDataMapper only ever sees this shape.
 */
data class NormalizedHealthPoint(
    /**
     * Stable, deterministic identifier derived from Health Connect's own
     * record metadata id (composite for multi-sample records like heart
     * rate — see HealthDataMapper). This is what the backend's unique
     * constraint on (userId, sourceRecordId) keys off of for idempotency:
     * re-reading the same Health Connect data and re-uploading it must
     * produce the same sourceRecordId every time.
     */
    val sourceRecordId: String,
    val parameterType: ParameterType,
    val value: Double,
    val recordedAt: Instant,
    val recordedEndAt: Instant?,
    /**
     * The calendar day this reading counts toward, decided here on-device
     * (where the user's local timezone at the moment of the reading is
     * actually known) rather than left for the backend to guess from a UTC
     * instant. See docs/ASSUMPTIONS.md.
     */
    val localDate: LocalDate,
)

/** Outcome of one sync attempt, surfaced to the dashboard screen's UI state. */
sealed class SyncOutcome {
    data object Idle : SyncOutcome()
    data object InProgress : SyncOutcome()
    data class Success(
        val recordsReceived: Int,
        val recordsInserted: Int,
        val recordsSkippedAsDuplicate: Int,
    ) : SyncOutcome()
    data class Failure(val message: String) : SyncOutcome()
}
