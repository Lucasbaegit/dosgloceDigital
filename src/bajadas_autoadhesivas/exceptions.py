"""Exceptions for Bajadas Autoadhesivas v1."""

class AutoadhesivasError(Exception):
    pass

class ConfigValidationError(AutoadhesivasError):
    pass

class QuoteInputError(AutoadhesivasError):
    pass

class PriceNotFoundError(AutoadhesivasError):
    pass
