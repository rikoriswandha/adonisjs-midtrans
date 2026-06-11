# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-06-11

### Added

- Initial release of `@rikology/adonisjs-midtrans`
- **Snap API** support for redirect checkout
- **Core API** support for credit card, bank transfer (BCA, BNI, BRI, Mandiri, Permata, CIMB), GoPay, ShopeePay, QRIS, convenience store (Indomaret/Alfamart), and BNPL (Akulaku/Kredivo)
- **Iris API** support for disbursement when `irisKey` is configured
- **Transaction management**: status, cancel, refund, expire, approve
- **Webhook helpers**: signature validation, notification parsing, transaction success detection
- Typed error hierarchy: `MidtransError`, `MidtransHTTPError`, `MidtransAPIError`, `MidtransValidationError`, `MidtransSignatureError`
- AdonisJS v7 `configure` hook with interactive setup, env variable injection, and config stub generation
- Type-safe `defineConfig` helper with runtime validation
