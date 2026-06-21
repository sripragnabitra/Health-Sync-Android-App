package com.independenceos.healthsync.data.remote

import com.independenceos.healthsync.data.remote.dto.ApiEnvelope
import com.independenceos.healthsync.data.remote.dto.AuthResponseDto
import com.independenceos.healthsync.data.remote.dto.DeviceDto
import com.independenceos.healthsync.data.remote.dto.IngestRequest
import com.independenceos.healthsync.data.remote.dto.IngestResponseDto
import com.independenceos.healthsync.data.remote.dto.LoginRequest
import com.independenceos.healthsync.data.remote.dto.RegisterDeviceRequest
import com.independenceos.healthsync.data.remote.dto.SignupRequest
import com.independenceos.healthsync.data.remote.dto.SyncStatusResponseDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/** Mirrors backend/README.md's route table one-to-one — see that file for the canonical contract. */
interface ApiService {

    @POST("auth/signup")
    suspend fun signup(@Body body: SignupRequest): ApiEnvelope<AuthResponseDto>

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): ApiEnvelope<AuthResponseDto>

    @POST("devices")
    suspend fun registerDevice(@Body body: RegisterDeviceRequest): ApiEnvelope<DeviceDto>

    @POST("sync/health-records")
    suspend fun ingestHealthRecords(@Body body: IngestRequest): ApiEnvelope<IngestResponseDto>

    @GET("sync/status")
    suspend fun getSyncStatus(): ApiEnvelope<SyncStatusResponseDto>
}
