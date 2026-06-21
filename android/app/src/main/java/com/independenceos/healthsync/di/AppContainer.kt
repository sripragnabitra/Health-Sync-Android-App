package com.independenceos.healthsync.di

import android.content.Context
import com.independenceos.healthsync.data.local.PreferencesDataStore
import com.independenceos.healthsync.data.remote.ApiService
import com.independenceos.healthsync.data.remote.NetworkModule
import com.independenceos.healthsync.data.repository.AuthRepository
import com.independenceos.healthsync.data.repository.DeviceRepository
import com.independenceos.healthsync.data.repository.SyncRepository
import com.independenceos.healthsync.healthconnect.HealthConnectManager

/**
 * A deliberately simple manual DI container instead of Hilt/Dagger.
 * Hilt's annotation processing adds a class of build failures (KSP/KAPT
 * misconfiguration, missing @AndroidEntryPoint, generated-code mismatches)
 * that are hard to debug without actually running a build — and this
 * project can't be compiled in the environment it was written in. At this
 * app's size (a handful of repositories, no multi-module graph) manual DI
 * is also just... fine. Hilt would be the natural next step if this grew
 * past one feature module.
 */
class AppContainer(context: Context) {
    private val dataStore = PreferencesDataStore(context)
    private val apiService: ApiService = NetworkModule.create(dataStore)

    val healthConnectManager = HealthConnectManager(context)
    val authRepository = AuthRepository(apiService, dataStore)
    val deviceRepository = DeviceRepository(apiService, dataStore)
    val syncRepository = SyncRepository(apiService, dataStore, deviceRepository, healthConnectManager)
    val preferencesDataStore = dataStore
}
