import unittest
from pathlib import Path
from unittest.mock import patch

import paramiko
from cryptography.fernet import InvalidToken

from immunity import (
    DataProtector,
    ProtectedSFTPStore,
    SFTPConfig,
    generate_encryption_key,
)


class DataProtectorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.protector = DataProtector(generate_encryption_key())

    def test_round_trip_and_per_record_owner_check(self) -> None:
        token = self.protector.encrypt(b"medical record", "user_owner")

        self.assertNotIn(b"medical record", token)
        self.assertEqual(self.protector.decrypt(token, "user_owner"), b"medical record")
        with self.assertRaises(PermissionError):
            self.protector.decrypt(token, "user_other")

    def test_tampered_ciphertext_is_rejected(self) -> None:
        token = self.protector.encrypt(b"record", "user_owner")

        with self.assertRaises(InvalidToken):
            self.protector.decrypt(token[:-1] + b"x", "user_owner")

    def test_sftp_access_check_happens_before_connection(self) -> None:
        store = ProtectedSFTPStore(
            self.protector,
            SFTPConfig(
                hostname="sftp.example.test",
                username="app",
                known_hosts=Path("known_hosts"),
                private_key=Path("id_ed25519"),
                remote_root="/records",
            ),
        )

        with patch.object(store, "_connect") as connect:
            with self.assertRaises(PermissionError):
                store.download("user_owner", "user_other", "record_1")

        connect.assert_not_called()

    def test_sftp_rejects_unknown_host_keys(self) -> None:
        store = ProtectedSFTPStore(
            self.protector,
            SFTPConfig(
                hostname="sftp.example.test",
                username="app",
                known_hosts=Path("known_hosts"),
                private_key=Path("id_ed25519"),
                remote_root="/records",
            ),
        )
        with patch("immunity.paramiko.SSHClient") as ssh_client_class:
            client = ssh_client_class.return_value
            with store._connect():
                pass

        client.load_host_keys.assert_called_once_with("known_hosts")
        policy = client.set_missing_host_key_policy.call_args.args[0]
        self.assertIsInstance(policy, paramiko.RejectPolicy)
        client.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
