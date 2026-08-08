"""Phone number detection shared across extractors — built on Google's
libphonenumber (via the `phonenumbers` package) instead of regex, since
phone formats vary too much across countries for regex to reliably parse."""
import phonenumbers

_FALLBACK_REGIONS = ["IN", "US", "GB", "AE", "CA", "AU", "DE", "FR", "SG", "PH", "PK", "NG"]


def find_phone_matches(text: str):
    """Yields phonenumbers.PhoneNumberMatch objects found in text, trying
    explicit "+countrycode" numbers first, then a broad set of common
    default regions for numbers written in national format."""
    seen_spans = set()
    for match in phonenumbers.PhoneNumberMatcher(text, None):
        seen_spans.add((match.start, match.end))
        yield match

    for region in _FALLBACK_REGIONS:
        for match in phonenumbers.PhoneNumberMatcher(text, region):
            span = (match.start, match.end)
            if span not in seen_spans:
                seen_spans.add(span)
                yield match


def find_best_phone(text: str) -> str | None:
    for match in find_phone_matches(text):
        return phonenumbers.format_number(match.number, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
    return None


def find_all_phones(text: str, limit: int = 3) -> list[str]:
    results = []
    for match in find_phone_matches(text):
        formatted = phonenumbers.format_number(match.number, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
        if formatted not in results:
            results.append(formatted)
        if len(results) >= limit:
            break
    return results


def strip_phone_numbers(text: str) -> str:
    """Blanks out any recognizable phone number substrings — used so a
    5-digit chunk of a phone number doesn't get misread as a postal code."""
    spans = [(m.start, m.end) for m in find_phone_matches(text)]
    if not spans:
        return text
    result = list(text)
    for start, end in spans:
        for i in range(start, end):
            result[i] = " "
    return "".join(result)
