package com.independenceos.healthsync.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class SignupRequest(val email: String, val password: String, val fullName: String? = null)

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class UserDto(val id: String, val email: String, val fullName: String?)

@Serializable
data class AuthResponseDto(val token: String, val user: UserDto)

@Serializable
data class ApiEnvelope<T>(val data: T)
