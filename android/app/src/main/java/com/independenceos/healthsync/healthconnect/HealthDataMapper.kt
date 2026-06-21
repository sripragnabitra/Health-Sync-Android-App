package com.independenceos.healthsync.healthconnect

import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import com.independenceos.healthsync.domain.NormalizedHealthPoint
import com.independenceos.healthsync.domain.ParameterType
import java.time.ZoneId

/**
 * Converts Health Connect's record types into this app's normalized
 * shape. Kept as a standalone object with no Health Connect *client* calls
 * in it (only record *model* types) so the mapping logic itself — the part
 * most likely to have a subtle bug — is plain, testable Kotlin.
 *
 * One record can produce more than one [NormalizedHealthPoint]: a
 * HeartRateRecord is a *session* containing many individual bpm samples,
 * not a single reading, and each sample needs its own sourceRecordId or
 * they'd collide under the backend's per-record idempotency key.
 */
object HealthDataMapper {

    fun mapSteps(record: StepsRecord): List<NormalizedHealthPoint> {
        val zone = zoneOf(record.startZoneOffset)
        return listOf(
            NormalizedHealthPoint(
                sourceRecordId = record.metadata.id,
                parameterType = ParameterType.STEPS,
                value = record.count.toDouble(),
                recordedAt = record.startTime,
                recordedEndAt = record.endTime,
                localDate = record.startTime.atZone(zone).toLocalDate(),
            )
        )
    }

    fun mapDistance(record: DistanceRecord): List<NormalizedHealthPoint> {
        val zone = zoneOf(record.startZoneOffset)
        return listOf(
            NormalizedHealthPoint(
                sourceRecordId = record.metadata.id,
                parameterType = ParameterType.DISTANCE_METERS,
                value = record.distance.inMeters,
                recordedAt = record.startTime,
                recordedEndAt = record.endTime,
                localDate = record.startTime.atZone(zone).toLocalDate(),
            )
        )
    }

    fun mapActiveCalories(record: ActiveCaloriesBurnedRecord): List<NormalizedHealthPoint> {
        val zone = zoneOf(record.startZoneOffset)
        return listOf(
            NormalizedHealthPoint(
                sourceRecordId = record.metadata.id,
                parameterType = ParameterType.ACTIVE_CALORIES,
                value = record.energy.inKilocalories,
                recordedAt = record.startTime,
                recordedEndAt = record.endTime,
                localDate = record.startTime.atZone(zone).toLocalDate(),
            )
        )
    }

    /**
     * A single HeartRateRecord spans startTime..endTime but contains a
     * *list* of timestamped bpm samples taken during that span — flatten
     * each sample into its own point. The composite id
     * "<record-id>_<sample-index>" is deterministic across re-syncs (same
     * record, same sample order, every time Health Connect returns it),
     * which is what idempotency depends on here.
     */
    fun mapHeartRate(record: HeartRateRecord): List<NormalizedHealthPoint> {
        val zone = zoneOf(record.startZoneOffset)
        return record.samples.mapIndexed { index, sample ->
            NormalizedHealthPoint(
                sourceRecordId = "${record.metadata.id}_$index",
                parameterType = ParameterType.HEART_RATE,
                value = sample.beatsPerMinute.toDouble(),
                recordedAt = sample.time,
                recordedEndAt = null,
                localDate = sample.time.atZone(zone).toLocalDate(),
            )
        }
    }

    /**
     * One sleep session -> one point, valued as total duration in minutes.
     * Attributed to the date the session *ended* (i.e. the morning you
     * woke up), which is the convention most fitness dashboards use for
     * "last night's sleep" — see docs/ASSUMPTIONS.md for the alternative
     * considered (attributing to the night it started) and why this was
     * preferred.
     */
    fun mapSleep(record: SleepSessionRecord): List<NormalizedHealthPoint> {
        val zone = zoneOf(record.endZoneOffset ?: record.startZoneOffset)
        val minutes = java.time.Duration.between(record.startTime, record.endTime).toMinutes().toDouble()
        return listOf(
            NormalizedHealthPoint(
                sourceRecordId = record.metadata.id,
                parameterType = ParameterType.SLEEP_DURATION,
                value = minutes,
                recordedAt = record.startTime,
                recordedEndAt = record.endTime,
                localDate = record.endTime.atZone(zone).toLocalDate(),
            )
        )
    }

    /** Health Connect's zoneOffset fields are nullable on some records/devices; fall back to the device's current zone. */
    private fun zoneOf(offset: java.time.ZoneOffset?): ZoneId = offset ?: ZoneId.systemDefault().rules.getOffset(java.time.Instant.now())
}
