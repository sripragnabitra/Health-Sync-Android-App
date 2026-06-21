package com.independenceos.healthsync.data.repository

import android.os.Build
import com.independenceos.healthsync.BuildConfig
import com.independenceos.healthsync.data.local.PreferencesDataStore
import com.independenceos.healthsync.data.remote.ApiService
import com.independenceos.healthsync.data.remote.dto.RegisterDeviceRequest
import com.independenceos.healthsync.data.remote.toUserMessage
import kotlinx.coroutines.flow.first

class DeviceRepository(
    private val api: ApiService,
    private val dataStore: PreferencesDataStore,
) {
    /**
     * Registers (or re-registers — it's an upsert server-side, see
     * backend devices.service.ts) this physical device and returns the
     * server-assigned device id needed for every sync call. Cached in
     * DataStore after the first call so a normal sync doesn't need a
     * network round trip just to re-confirm the device exists.
     */
    suspend fun ensureRegistered(): Result<String> {
        val cached = dataStore.serverDeviceId.first()
        if (cached != null) return Result.success(cached)

        return runCatching {
            val clientDeviceId = dataStore.getOrCreateClientDeviceId()
            val response = api.registerDevice(
                RegisterDeviceRequest(
                    clientDeviceId = clientDeviceId,
                    platform = "ANDROID",
                    deviceModel = "${Build.MANUFACTURER} ${Build.MODEL}",
                    osVersion = "Android ${Build.VERSION.RELEASE}",
                    appVersion = BuildConfig.VERSION_NAME,
                )
            )
            dataStore.saveServerDeviceId(response.data.id)
            response.data.id
        }.let { result -> result.exceptionOrNull()?.let { Result.failure(Exception(it.toUserMessage())) } ?: result }
    }
}
