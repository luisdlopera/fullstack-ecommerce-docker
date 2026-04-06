export enum AuthMessages {
  // Success messages
  LOGIN_SUCCESSFUL = '¡Bien hecho! Has iniciado sesión correctamente.',
  REGISTER_SUCCESSFUL = '¡Bien hecho! Te has registrado correctamente. Revisa tu correo para verificar tu cuenta.',
  LOGOUT_SUCCESSFUL = '¡Hasta luego! Has cerrado sesión correctamente.',
  PASSWORD_RESET_SUCCESSFUL = '¡Bien hecho! Tu contraseña se ha restablecido correctamente.',
  PASSWORD_RESET_EMAIL_SENT = '¡Bien hecho! Hemos enviado un correo con instrucciones para restablecer tu contraseña.',
  EMAIL_VERIFICATION_SUCCESSFUL = '¡Bien hecho! Tu correo ha sido verificado correctamente.',
  EMAIL_VERIFICATION_RESENT = '¡Bien hecho! Hemos reenviado el correo de verificación.',
  TOKEN_REFRESH_SUCCESSFUL = '¡Bien hecho! Tu sesión ha sido renovada.',

  // Error messages
  INTERNAL_SERVER_ERROR = '¡Ups! Algo salió mal, estamos trabajando para resolverlo.',
  VALIDATION_ERROR = '¡Ups! Parece que hay errores en los datos enviados.',
  UNAUTHORIZED = '¡Ups! No tienes permisos para realizar esta acción.',
  FORBIDDEN = '¡Ups! No tienes acceso a este recurso.',

  // Auth specific errors
  USER_NOT_FOUND = '¡Ups! El usuario no existe.',
  USER_INACTIVE = '¡Ups! Tu cuenta está inactiva. Contacta al administrador.',
  EMAIL_NOT_VERIFIED = '¡Ups! Debes verificar tu correo electrónico antes de iniciar sesión.',
  INVALID_CREDENTIALS = '¡Ups! Correo o contraseña incorrectos.',
  EMAIL_ALREADY_EXISTS = '¡Ups! Este correo ya está registrado.',
  INVALID_TOKEN = '¡Ups! El token es inválido o ha expirado.',
  TOKEN_REUSE_DETECTED = '¡Ups! Detectamos uso indebido de un token. Por favor inicia sesión nuevamente.',
  SESSION_EXPIRED = '¡Ups! Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
  MFA_REQUIRED = '¡Ups! Se requiere autenticación de dos factores.',
  MFA_INVALID = '¡Ups! El código de verificación es incorrecto.',
  MFA_NOT_ENROLLED = '¡Ups! El usuario no tiene MFA habilitado.',
  PASSWORD_WEAK = '¡Ups! La contraseña no cumple con los requisitos de seguridad.',
  PASSWORD_MISMATCH = '¡Ups! Las contraseñas no coinciden.',
  JWT_SECRET_MISSING = '¡Ups! Error de configuración del servidor.',
  MISSING_AUTH_HEADER = '¡Ups! Falta el token de autenticación.',
  INVALID_TOKEN_TYPE = '¡Ups! Tipo de token inválido.',
  INSUFFICIENT_PERMISSIONS = '¡Ups! No tienes permisos suficientes para esta acción.',
  ACCOUNT_NOT_ALLOWED = '¡Ups! Tu cuenta no tiene permitido realizar esta acción.',
  CUSTOMER_ROLE_RESTRICTED = '¡Ups! Los clientes no pueden acceder a recursos de administrador.',

  // Email errors
  EMAIL_SEND_ERROR = '¡Ups! Error al enviar el correo electrónico.',
  EMAIL_VERIFICATION_SEND_ERROR = '¡Ups! Error al enviar el correo de verificación.',
  PASSWORD_RESET_SEND_ERROR = '¡Ups! Error al enviar el correo de recuperación.',
}
