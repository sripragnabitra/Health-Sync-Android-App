package com.independenceos.healthsync.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Mirrors backend/src/core/types.ts ParameterType exactly — these
 * @SerialName values are what actually goes over the wire, so this enum's
 * Kotlin names can drift from the backend's without breaking anything, but
 * the SerialName strings must not.
 */
@Serializable
enum class ParameterType {
    @SerialName("STEPS") STEPS,
    @SerialName("DISTANCE_METERS") DISTANCE_METERS,
    @SerialName("ACTIVE_CALORIES") ACTIVE_CALORIES,
    @SerialName("HEART_RATE") HEART_RATE,
    @SerialName("SLEEP_DURATION") SLEEP_DURATION,
}
