package com.independenceos.healthsync.data.repository

import com.independenceos.healthsync.data.local.PreferencesDataStore
import com.independenceos.healthsync.data.remote.ApiService
import com.independenceos.healthsync.data.remote.dto.HealthRecordDto
import com.independenceos.healthsync.data.remote.dto.IngestRequest
import com.independenceos.healthsync.data.remote.toUserMessage
import com.independenceos.healthsync.domain.NormalizedHealthPoint
import com.independenceos.healthsync.domain.SyncOutcome
import com.independenceos.healthsync.healthconnect.HealthConnectManager
import kotlinx.coroutines.flow.first
import java.time.Instant
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

class SyncRepository(
    private val api: ApiService,
    private val dataStore: PreferencesDataStore,
    private val deviceRepository: DeviceRepository,
    private val healthConnectManager: HealthConnectManager,
) {
    private val batchSize = 500

    /**
     * [lookbackDays] is now passed in by the caller (the user's chosen
     * date range from the dashboard picker) rather than being fixed here.
     * Defaults to 7 for normal re-syncs, 30 on first ever sync — but if
     * the user explicitly picks "Last 90 days", that value comes through
     * directly and overrides the automatic default.
     */
    suspend fun performSync(trigger: String, lookbackDays: Long? = null): SyncOutcome {
        if (!healthConnectManager.hasAllRequiredPermissions()) {
            return SyncOutcome.Failure("Health Sync no longer has permission to read your health data. Please re-grant access in Health Connect.")
        }
        val deviceResult = deviceRepository.ensureRegistered()
        val deviceId = deviceResult.getOrElse { return SyncOutcome.Failure(it.toUserMessage()) }

        val hasSyncedBefore = dataStore.lastSyncAt.first() != null
        val days = lookbackDays ?: if (hasSyncedBefore) 7L else 30L
        val end = Instant.now()
        val start = end.minus(days, ChronoUnit.DAYS)

        val points = runCatching { healthConnectManager.readAllInRange(start, end) }
            .getOrElse { return SyncOutcome.Failure("Couldn't read Health Connect data: ${it.message}") }

        if (points.isEmpty()) {
            dataStore.saveLastSyncAt(end.toString())
            return SyncOutcome.Success(recordsReceived = 0, recordsInserted = 0, recordsSkippedAsDuplicate = 0)
        }

        var totalReceived = 0
        var totalInserted = 0
        var totalSkipped = 0

        for (batch in points.chunked(batchSize)) {
            val response = runCatching {
                api.ingestHealthRecords(
                    IngestRequest(deviceId = deviceId, trigger = trigger, records = batch.map { it.toDto() })
                )
            }.getOrElse { return SyncOutcome.Failure(it.toUserMessage()) }

            totalReceived += response.data.recordsReceived
            totalInserted += response.data.recordsInserted
            totalSkipped += response.data.recordsSkippedAsDuplicate
        }

        dataStore.saveLastSyncAt(end.toString())
        return SyncOutcome.Success(totalReceived, totalInserted, totalSkipped)
    }

    suspend fun getSyncStatus(): Result<com.independenceos.healthsync.data.remote.dto.SyncStatusResponseDto> =
        runCatching { api.getSyncStatus().data }
            .let { result -> result.exceptionOrNull()?.let { Result.failure(Exception(it.toUserMessage())) } ?: result }

    private fun NormalizedHealthPoint.toDto() = HealthRecordDto(
        sourceRecordId = sourceRecordId,
        parameterType = parameterType,
        value = value,
        recordedAt = recordedAt.toString(),
        recordedEndAt = recordedEndAt?.toString(),
        localDate = localDate.format(DateTimeFormatter.ISO_LOCAL_DATE),
    )
}
