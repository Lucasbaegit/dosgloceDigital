"""Custom exceptions for Bajadas v2 engine."""


class BajadasV2Error(Exception):
    """Base exception for Bajadas v2."""


class ConfigValidationError(BajadasV2Error):
    """Raised when config or data files are invalid."""


class QuoteInputError(BajadasV2Error):
    """Raised when quote input is invalid."""


class PriceNotFoundError(BajadasV2Error):
    """Raised when no matching price can be resolved."""
