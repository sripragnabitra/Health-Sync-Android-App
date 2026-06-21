package com.independenceos.healthsync.data.repository

import com.independenceos.healthsync.data.local.PreferencesDataStore
import com.independenceos.healthsync.data.remote.ApiService
import com.independenceos.healthsync.data.remote.dto.LoginRequest
import com.independenceos.healthsync.data.remote.dto.SignupRequest
import com.independenceos.healthsync.data.remote.toUserMessage
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class AuthRepository(
    private val api: ApiService,
    private val dataStore: PreferencesDataStore,
) {
    val isLoggedIn: Flow<Boolean> = dataStore.authToken.map { it != null }

    suspend fun login(email: String, password: String): Result<Unit> = runCatching {
        val response = api.login(LoginRequest(email, password))
        dataStore.saveSession(response.data.token, response.data.user.email)
    }.mapError()

    suspend fun signup(email: String, password: String, fullName: String?): Result<Unit> = runCatching {
        val response = api.signup(SignupRequest(email, password, fullName))
        dataStore.saveSession(response.data.token, response.data.user.email)
    }.mapError()

    suspend fun logout() = dataStore.clearSession()

    private fun <T> Result<T>.mapError(): Result<T> =
        exceptionOrNull()?.let { Result.failure(Exception(it.toUserMessage())) } ?: this
}
