"""Exceptions for Tarjetas 9x5 module."""


class QuoteInputError(ValueError):
    """Invalid quote input."""


class PriceNotFoundError(LookupError):
    """Price not found for the requested combination."""
