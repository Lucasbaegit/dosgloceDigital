"""Exceptions for Laminado additionals v1."""


class LaminadoAdicionalError(Exception):
    """Base exception for the laminado adicional domain."""


class ConfigValidationError(LaminadoAdicionalError):
    """Raised when laminado config/data is invalid."""


class QuoteInputError(LaminadoAdicionalError):
    """Raised when quote input is invalid."""

