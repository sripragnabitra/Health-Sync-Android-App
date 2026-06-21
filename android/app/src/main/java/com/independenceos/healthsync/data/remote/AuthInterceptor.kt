package com.independenceos.healthsync.data.remote

import com.independenceos.healthsync.data.local.PreferencesDataStore
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response

/**
 * Attaches `Authorization: Bearer <token>` to every request that has one
 * stored. OkHttp interceptors are synchronous, but reading from DataStore
 * is suspend-only — `runBlocking` here is the standard, accepted pattern
 * for this exact situation: the interceptor already runs on OkHttp's own
 * background dispatcher, so a brief local-disk read doesn't block the
 * caller's main thread or anything UI-related. The alternative (keeping a
 * separate in-memory token cache kept in sync with DataStore) adds a second
 * source of truth for one field; not worth it at this scale.
 */
class AuthInterceptor(private val dataStore: PreferencesDataStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { dataStore.currentAuthToken() }
        val request = if (token != null) {
            chain.request().newBuilder().addHeader("Authorization", "Bearer $token").build()
        } else {
            chain.request()
        }
        return chain.proceed(request)
    }
}
