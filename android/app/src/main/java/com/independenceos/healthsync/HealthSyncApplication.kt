package com.independenceos.healthsync

import android.app.Application
import com.independenceos.healthsync.di.AppContainer
import com.independenceos.healthsync.sync.SyncWorker

class HealthSyncApplication : Application() {
    lateinit var container: AppContainer

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        SyncWorker.schedule(this)
    }
}
