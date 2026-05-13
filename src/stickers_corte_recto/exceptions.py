class QuoteInputError(ValueError):
    """Invalid stickers quote input."""


class PriceNotFoundError(LookupError):
    """No matching matrix row for stickers quote."""
