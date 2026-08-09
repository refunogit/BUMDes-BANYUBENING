from __future__ import annotations

import platform
import sys

MIN_VERSION = (3, 10)
MAX_VERSION = (3, 14)  # exclusive
RECOMMENDED_VERSION = "3.11"


def version_text(version: tuple[int, int, int]) -> str:
    return ".".join(str(part) for part in version)


def main() -> int:
    version = sys.version_info[:3]
    impl = platform.python_implementation()
    arch_bits = 64 if sys.maxsize > 2**32 else 32

    problems: list[str] = []
    if impl != "CPython":
        problems.append(f"unsupported interpreter: {impl}")
    if version < MIN_VERSION or version >= MAX_VERSION:
        problems.append(
            "unsupported Python version: "
            f"{version_text(version)} (supported: {version_text((*MIN_VERSION, 0))} "
            f"to {MAX_VERSION[0]}.{MAX_VERSION[1] - 1}.x)"
        )
    if arch_bits != 64:
        problems.append("32-bit Python is not supported; use 64-bit Python")

    if problems:
        print("ERROR: Python environment is not supported for Automated Comic Translator.")
        print(f"Detected: {impl} {version_text(version)} ({arch_bits}-bit)")
        for problem in problems:
            print(f"- {problem}")
        print()
        print("Use CPython 3.10-3.13 64-bit. Recommended: Python 3.11 64-bit.")
        print("Reason: packages such as NumPy, OpenCV, PaddlePaddle, and PaddleOCR")
        print("may not publish prebuilt wheels for brand-new Python releases yet.")
        if sys.platform.startswith("win"):
            print()
            print("Windows tips:")
            print("- Install Python 3.11 x64 from python.org")
            print("- Reopen Command Prompt / PowerShell after installation")
            print("- If multiple Python versions are installed, this project will prefer")
            print("  the `py` launcher (for example `py -3.11`) when available")
        return 1

    print(
        f"Using supported Python: {impl} {version_text(version)} ({arch_bits}-bit)"
    )
    if version[:2] != (3, 11):
        print(f"Note: Python {RECOMMENDED_VERSION} 64-bit is the recommended version.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
