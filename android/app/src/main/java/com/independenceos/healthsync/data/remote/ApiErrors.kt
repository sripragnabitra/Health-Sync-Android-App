package com.independenceos.healthsync.data.remote

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import retrofit2.HttpException

@Serializable
private data class ErrorBody(val error: ErrorDetail)

@Serializable
private data class ErrorDetail(val code: String, val message: String, val requestId: String? = null)

private val errorJson = Json { ignoreUnknownKeys = true }

/**
 * The backend always responds to failures with `{error:{code,message,requestId}}`
 * (see backend/src/middleware/errorHandler.ts) — this pulls the human-readable
 * `message` out of that envelope so the UI can show something better than
 * "HTTP 401".
 */
fun Throwable.toUserMessage(): String {
    if (this is HttpException) {
        val raw = response()?.errorBody()?.string()
        if (raw != null) {
            runCatching { errorJson.decodeFromString<ErrorBody>(raw) }
                .getOrNull()
                ?.let { return it.error.message }
        }
        return "Request failed (HTTP ${code()})"
    }
    return message ?: "Something went wrong"
}
