class QuoteInputError(ValueError):
    """Invalid imanes quote input."""


class PriceNotFoundError(LookupError):
    """No matching matrix row for imanes quote."""
