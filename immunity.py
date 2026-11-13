import os
import re
from contextlib import contextmanager
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path, PurePosixPath
from typing import Generator

import paramiko
from cryptography.fernet import Fernet


_IDENTIFIER = re.compile(r"[A-Za-z0-9_-]+\Z")


def generate_encryption_key() -> str:
    """Generate a Fernet key for provisioning DATA_ENCRYPTION_KEY."""
    return Fernet.generate_key().decode("ascii")


class DataProtector:
    """Encrypt records and restrict decryption to their Clerk owner."""

    def __init__(self, key: str | None = None) -> None:
        key_value = key if key is not None else os.environ["DATA_ENCRYPTION_KEY"]
        self._fernet = Fernet(key_value.encode("ascii"))

    def encrypt(self, data: bytes, owner_id: str) -> bytes:
        owner = _validate_identifier(owner_id, "owner_id")
        return self._fernet.encrypt(b"v1:" + owner.encode("ascii") + b"\n" + data)

    def decrypt(self, token: bytes, clerk_user_id: str) -> bytes:
        authenticated_user = _validate_identifier(clerk_user_id, "clerk_user_id")
        plaintext = self._fernet.decrypt(token)
        metadata, separator, data = plaintext.partition(b"\n")
        if not separator or not metadata.startswith(b"v1:"):
            raise ValueError("Encrypted record has an unsupported format.")

        try:
            owner_id = metadata[3:].decode("ascii")
        except UnicodeDecodeError as error:
            raise ValueError("Encrypted record has an invalid owner identifier.") from error

        if not _IDENTIFIER.fullmatch(owner_id):
            raise ValueError("Encrypted record has an invalid owner identifier.")
        if owner_id != authenticated_user:
            raise PermissionError("The authenticated user does not own this record.")
        return data


@dataclass(frozen=True)
class SFTPConfig:
    hostname: str
    username: str
    known_hosts: Path
    private_key: Path
    remote_root: str
    port: int = 22
    timeout: float = 10.0

    def __post_init__(self) -> None:
        root = PurePosixPath(self.remote_root)
        if not root.is_absolute() or ".." in root.parts:
            raise ValueError("remote_root must be an absolute path without '..' segments.")
        if not 1 <= self.port <= 65535:
            raise ValueError("port must be between 1 and 65535.")
        if self.timeout <= 0:
            raise ValueError("timeout must be positive.")


class ProtectedSFTPStore:
    """Transfer encrypted per-record data over host-key-verified SFTP.

    The caller must pass the Clerk subject from a verified authentication
    context and the record owner ID loaded from trusted server-side storage.
    """

    def __init__(self, protector: DataProtector, config: SFTPConfig) -> None:
        self._protector = protector
        self._config = config
        self._remote_root = PurePosixPath(config.remote_root)

    def upload(
        self,
        data: bytes,
        owner_id: str,
        clerk_user_id: str,
        record_id: str,
    ) -> None:
        owner = _validate_identifier(owner_id, "owner_id")
        self._authorize(owner, clerk_user_id)
        remote_path = self._record_path(owner, record_id)
        encrypted = self._protector.encrypt(data, owner)

        with self._connect() as client:
            with client.open_sftp() as sftp:
                sftp.putfo(BytesIO(encrypted), str(remote_path))

    def download(
        self,
        owner_id: str,
        clerk_user_id: str,
        record_id: str,
    ) -> bytes:
        owner = _validate_identifier(owner_id, "owner_id")
        self._authorize(owner, clerk_user_id)
        remote_path = self._record_path(owner, record_id)

        with self._connect() as client:
            with client.open_sftp() as sftp:
                with sftp.open(str(remote_path), "rb") as remote_file:
                    encrypted = remote_file.read()

        return self._protector.decrypt(encrypted, clerk_user_id)

    def _authorize(self, owner_id: str, clerk_user_id: str) -> None:
        authenticated_user = _validate_identifier(clerk_user_id, "clerk_user_id")
        if owner_id != authenticated_user:
            raise PermissionError("The authenticated user does not own this record.")

    def _record_path(self, owner_id: str, record_id: str) -> PurePosixPath:
        record = _validate_identifier(record_id, "record_id")
        return self._remote_root / owner_id / f"{record}.enc"

    @contextmanager
    def _connect(self) -> Generator[paramiko.SSHClient, None, None]:
        client = paramiko.SSHClient()
        try:
            client.load_host_keys(str(self._config.known_hosts))
            client.set_missing_host_key_policy(paramiko.RejectPolicy())
            client.connect(
                hostname=self._config.hostname,
                port=self._config.port,
                username=self._config.username,
                key_filename=str(self._config.private_key),
                allow_agent=False,
                look_for_keys=False,
                timeout=self._config.timeout,
                banner_timeout=self._config.timeout,
                auth_timeout=self._config.timeout,
            )
            yield client
        finally:
            client.close()


def _validate_identifier(value: str, name: str) -> str:
    if not isinstance(value, str) or not _IDENTIFIER.fullmatch(value):
        raise ValueError(f"{name} must contain only letters, digits, '_' or '-'.")
    return value
