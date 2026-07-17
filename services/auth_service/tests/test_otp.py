from services.auth_service.plugins.security.otp import generate_secure_otp


def test_generate_secure_otp_default_length() -> None:
    otp = generate_secure_otp()
    assert len(otp) == 4
    assert otp.isdigit()


def test_generate_secure_otp_custom_length() -> None:
    otp = generate_secure_otp(length=6)
    assert len(otp) == 6
    assert otp.isdigit()


def test_generate_secure_otp_randomness() -> None:
    otps = {generate_secure_otp() for _ in range(100)}
    # With 100 generated 4-digit OTPs, the chance of all of them being unique is extremely high,
    # and certainly we should see a large set of unique values.
    assert len(otps) > 90
