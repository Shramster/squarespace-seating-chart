import hashlib
import hmac


def verify_squarespace_signature(secret_hex, raw_body, signature_header):
    """
    Squarespace signs webhook bodies as:
      hex(HMAC-SHA256(hexToBytes(secret), raw_request_body))
    compared against the Squarespace-Signature header.
    """
    if not signature_header:
        return False
    try:
        key = bytes.fromhex(secret_hex)
    except ValueError:
        return False
    expected = hmac.new(key, raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header)
