package com.independenceos.healthsync.healthconnect

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.independenceos.healthsync.domain.NormalizedHealthPoint
import java.time.Instant

sealed class HealthConnectAvailability {
    data object Available : HealthConnectAvailability()
    data object NotInstalled : HealthConnectAvailability()
    data object UpdateRequired : HealthConnectAvailability()
}

class HealthConnectManager(private val context: Context) {

    private val client: HealthConnectClient? by lazy {
        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
            HealthConnectClient.getOrCreate(context)
        } else null
    }

    fun availability(): HealthConnectAvailability =
        when (HealthConnectClient.getSdkStatus(context)) {
            HealthConnectClient.SDK_AVAILABLE -> HealthConnectAvailability.Available
            HealthConnectClient.SDK_UNAVAILABLE -> HealthConnectAvailability.NotInstalled
            else -> HealthConnectAvailability.UpdateRequired
        }

    /** One read permission per record type mapped in [HealthDataMapper] — exactly the five tracked parameters. */
    val requiredPermissions: Set<String> = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
    )

    /** Used to build the system permission-request launcher in the UI layer. */
    fun permissionRequestContract() = PermissionController.createRequestPermissionResultContract()

    suspend fun grantedPermissions(): Set<String> {
        val c = client ?: return emptySet()
        return c.permissionController.getGrantedPermissions()
    }

    suspend fun hasAllRequiredPermissions(): Boolean = grantedPermissions().containsAll(requiredPermissions)

    /**
     * Reads all five parameter types for [start]..[end] and returns them
     * already flattened into normalized points. Each record type is read
     * independently — Health Connect doesn't offer a single
     * "read everything" call — but failures are isolated per type via
     * [runCatching] so one misbehaving record type (or a permission that
     * was silently revoked since the last check) doesn't blank out the
     * other four.
     */
    suspend fun readAllInRange(start: Instant, end: Instant): List<NormalizedHealthPoint> {
        val c = client ?: return emptyList()
        val filter = TimeRangeFilter.between(start, end)
        val points = mutableListOf<NormalizedHealthPoint>()

        runCatching {
            c.readRecords(ReadRecordsRequest(StepsRecord::class, timeRangeFilter = filter)).records
        }.onSuccess { records -> records.forEach { points += HealthDataMapper.mapSteps(it) } }

        runCatching {
            c.readRecords(ReadRecordsRequest(DistanceRecord::class, timeRangeFilter = filter)).records
        }.onSuccess { records -> records.forEach { points += HealthDataMapper.mapDistance(it) } }

        runCatching {
            c.readRecords(ReadRecordsRequest(ActiveCaloriesBurnedRecord::class, timeRangeFilter = filter)).records
        }.onSuccess { records -> records.forEach { points += HealthDataMapper.mapActiveCalories(it) } }

        runCatching {
            c.readRecords(ReadRecordsRequest(HeartRateRecord::class, timeRangeFilter = filter)).records
        }.onSuccess { records -> records.forEach { points += HealthDataMapper.mapHeartRate(it) } }

        runCatching {
            c.readRecords(ReadRecordsRequest(SleepSessionRecord::class, timeRangeFilter = filter)).records
        }.onSuccess { records -> records.forEach { points += HealthDataMapper.mapSleep(it) } }

        return points
    }
}
