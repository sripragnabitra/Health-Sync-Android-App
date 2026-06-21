package com.independenceos.healthsync.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.util.UUID

private val Context.dataStore by preferencesDataStore(name = "health_sync_prefs")

/**
 * Everything this app needs to remember between launches, in one place:
 * the JWT, the locally-generated client device id (stable across
 * reinstalls would be nice but isn't achievable without extra permissions
 * — see ASSUMPTIONS.md — so it's stable for the life of one install), the
 * server-assigned device id returned by POST /devices, and when we last
 * synced successfully.
 */
class PreferencesDataStore(private val context: Context) {

    private object Keys {
        val AUTH_TOKEN = stringPreferencesKey("auth_token")
        val USER_EMAIL = stringPreferencesKey("user_email")
        val CLIENT_DEVICE_ID = stringPreferencesKey("client_device_id")
        val SERVER_DEVICE_ID = stringPreferencesKey("server_device_id")
        val LAST_SYNC_AT = stringPreferencesKey("last_sync_at")
    }

    val authToken: Flow<String?> = context.dataStore.data.map { it[Keys.AUTH_TOKEN] }
    val userEmail: Flow<String?> = context.dataStore.data.map { it[Keys.USER_EMAIL] }
    val serverDeviceId: Flow<String?> = context.dataStore.data.map { it[Keys.SERVER_DEVICE_ID] }
    val lastSyncAt: Flow<String?> = context.dataStore.data.map { it[Keys.LAST_SYNC_AT] }

    suspend fun currentAuthToken(): String? = authToken.first()

    suspend fun saveSession(token: String, email: String) {
        context.dataStore.edit {
            it[Keys.AUTH_TOKEN] = token
            it[Keys.USER_EMAIL] = email
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit {
            it.remove(Keys.AUTH_TOKEN)
            it.remove(Keys.USER_EMAIL)
            it.remove(Keys.SERVER_DEVICE_ID)
        }
    }

    /** Generated once per install on first need, then persisted forever — this is what makes device registration idempotent. */
    suspend fun getOrCreateClientDeviceId(): String {
        val existing = context.dataStore.data.map { it[Keys.CLIENT_DEVICE_ID] }.first()
        if (existing != null) return existing
        val generated = UUID.randomUUID().toString()
        context.dataStore.edit { it[Keys.CLIENT_DEVICE_ID] = generated }
        return generated
    }

    suspend fun saveServerDeviceId(deviceId: String) {
        context.dataStore.edit { it[Keys.SERVER_DEVICE_ID] = deviceId }
    }

    suspend fun saveLastSyncAt(isoInstant: String) {
        context.dataStore.edit { it[Keys.LAST_SYNC_AT] = isoInstant }
    }
}
