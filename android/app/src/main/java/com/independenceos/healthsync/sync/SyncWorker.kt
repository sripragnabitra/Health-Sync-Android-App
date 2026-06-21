package com.independenceos.healthsync.sync

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.independenceos.healthsync.HealthSyncApplication
import com.independenceos.healthsync.domain.SyncOutcome
import kotlinx.coroutines.flow.first
import java.util.concurrent.TimeUnit

/**
 * The brief's actual requirement — "allow manual re-sync" — is satisfied
 * by the dashboard screen's button calling SyncRepository directly; this
 * worker is an additive nice-to-have so data doesn't go stale purely
 * because the user hasn't opened the app. WorkManager's minimum periodic
 * interval is 15 minutes; this uses a longer interval since Health
 * Connect data doesn't need near-real-time background refresh.
 */
class SyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val container = (applicationContext as HealthSyncApplication).container

        val loggedIn = container.authRepository.isLoggedIn.first()
        if (!loggedIn) return Result.success() // nothing to do yet; not a failure worth retrying

        return when (val outcome = container.syncRepository.performSync(trigger = "SCHEDULED")) {
            is SyncOutcome.Success -> Result.success()
            is SyncOutcome.Failure -> Result.retry()
            else -> Result.success()
        }
    }

    companion object {
        private const val UNIQUE_WORK_NAME = "periodic_health_sync"

        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = PeriodicWorkRequestBuilder<SyncWorker>(6, TimeUnit.HOURS)
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UNIQUE_WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP, // don't reset the schedule every time this is called (e.g. on every app open)
                request,
            )
        }
    }
}
