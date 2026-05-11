/**
 * Midtrans error class hierarchy
 *
 * Provides typed error classes for Midtrans API integration.
 * All toJSON() methods exclude sensitive data (serverKey, etc.).
 */

export class MidtransError extends Error {
  public statusCode?: number
  public apiResponse?: string

  constructor(message: string) {
    super(message)
    this.name = 'MidtransError'
  }

  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      statusCode: this.statusCode,
      apiResponse: this.apiResponse,
    }
  }
}

export class MidtransHTTPError extends MidtransError {
  public requestUrl: string
  public requestMethod: string

  constructor(statusCode: number, requestUrl: string, requestMethod: string, message: string) {
    super(message)
    this.name = 'MidtransHTTPError'
    this.statusCode = statusCode
    this.requestUrl = requestUrl
    this.requestMethod = requestMethod
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      requestUrl: this.requestUrl,
      requestMethod: this.requestMethod,
    }
  }
}

export class MidtransAPIError extends MidtransError {
  public statusMessage: string
  public errorMessages: string[]

  constructor(statusCode: number, statusMessage: string, errorMessages: string[]) {
    super(statusMessage)
    this.name = 'MidtransAPIError'
    this.statusCode = statusCode
    this.statusMessage = statusMessage
    this.errorMessages = errorMessages
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      statusMessage: this.statusMessage,
      errorMessages: this.errorMessages,
    }
  }
}

export class MidtransValidationError extends MidtransError {
  public field: string

  constructor(field: string, message: string) {
    super(message)
    this.name = 'MidtransValidationError'
    this.field = field
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      field: this.field,
    }
  }
}

export class MidtransSignatureError extends MidtransError {
  constructor(message: string) {
    super(message)
    this.name = 'MidtransSignatureError'
  }
}
