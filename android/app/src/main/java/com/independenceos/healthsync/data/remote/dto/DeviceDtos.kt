package com.independenceos.healthsync.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class RegisterDeviceRequest(
    val clientDeviceId: String,
    val platform: String = "ANDROID",
    val deviceModel: String? = null,
    val osVersion: String? = null,
    val appVersion: String? = null,
)

@Serializable
data class DeviceDto(val id: String, val clientDeviceId: String, val platform: String)
