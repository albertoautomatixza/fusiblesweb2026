#!/usr/bin/env python3
"""Utility to detect binary files tracked in the repository.

Scans all files inside the project directory (excluding the Git metadata
folder by default) and reports any file that appears to be binary so they
can be removed or converted to inline assets.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Iterable

# Byte values that are considered "text". Control characters are taken from
# the standard definition used by the Unix `file` tool for heuristics.
_TEXT_BYTES = bytes({7, 8, 9, 10, 12, 13, 27, *range(0x20, 0x7F)})


def iter_files(root: Path, *, exclude: Iterable[str]) -> Iterable[Path]:
    """Yield files under *root* while skipping excluded directories."""
    excluded = {root / name for name in exclude}
    for path in root.rglob('*'):
        if not path.is_file():
            continue
        if any(parent in excluded for parent in path.parents):
            continue
        yield path


def is_binary(path: Path, *, threshold: float = 0.30) -> bool:
    """Return True if *path* is likely to be a binary file."""
    try:
        data = path.read_bytes()
    except OSError as exc:  # pragma: no cover - unexpected filesystem errors
        raise RuntimeError(f'No se pudo leer {path}: {exc}') from exc

    if not data:
        return False

    if b'\x00' in data:
        return True

    non_text = sum(byte not in _TEXT_BYTES for byte in data)
    return non_text / len(data) >= threshold


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        'paths',
        nargs='*',
        type=Path,
        default=[Path.cwd()],
        help='Paths to scan (default: directorio actual).',
    )
    parser.add_argument(
        '--exclude',
        action='append',
        default=['.git', '__pycache__'],
        help='Directorios a excluir (puede repetirse).',
    )
    parser.add_argument(
        '--threshold',
        type=float,
        default=0.30,
        help='Porcentaje mínimo de bytes no textuales para marcar un archivo.',
    )
    args = parser.parse_args(argv)

    binaries: list[Path] = []
    for base in args.paths:
        root = base.resolve()
        if not root.exists():
            parser.error(f'Ruta no encontrada: {base}')
        for path in iter_files(root, exclude=args.exclude):
            if is_binary(path, threshold=args.threshold):
                binaries.append(path)

    if binaries:
        print('Archivos binarios detectados:')
        for path in sorted(binaries):
            print(f' - {path}')
        return 1

    print('No se detectaron archivos binarios.')
    return 0


if __name__ == '__main__':  # pragma: no cover
    sys.exit(main(sys.argv[1:]))
