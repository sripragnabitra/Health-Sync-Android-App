package com.independenceos.healthsync.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.independenceos.healthsync.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isSignupMode: Boolean = false,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,
)

class LoginViewModel(private val authRepository: AuthRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmailChange(value: String) { _uiState.value = _uiState.value.copy(email = value) }
    fun onPasswordChange(value: String) { _uiState.value = _uiState.value.copy(password = value) }
    fun toggleMode() { _uiState.value = _uiState.value.copy(isSignupMode = !_uiState.value.isSignupMode, errorMessage = null) }

    fun submit(onSuccess: () -> Unit) {
        val state = _uiState.value
        _uiState.value = state.copy(isSubmitting = true, errorMessage = null)

        viewModelScope.launch {
            val result = if (state.isSignupMode) {
                authRepository.signup(state.email, state.password, fullName = null)
            } else {
                authRepository.login(state.email, state.password)
            }

            result
                .onSuccess {
                    _uiState.value = _uiState.value.copy(isSubmitting = false)
                    onSuccess()
                }
                .onFailure { error ->
                    _uiState.value = _uiState.value.copy(isSubmitting = false, errorMessage = error.message)
                }
        }
    }
}
