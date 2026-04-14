from __future__ import annotations

import argparse
import io
import os
from pathlib import Path

from PIL import Image
from pygltflib import GLTF2


def pad4(data: bytes) -> bytes:
    padding = (-len(data)) % 4
    if not padding:
        return data
    return data + (b"\x00" * padding)


def get_buffer_view_bytes(blob: bytes, byte_offset: int | None, byte_length: int) -> bytes:
    start = byte_offset or 0
    end = start + byte_length
    return blob[start:end]


def encode_image(source_bytes: bytes, mime_type: str | None, max_size: int, jpeg_quality: int) -> tuple[bytes, str | None]:
    image = Image.open(io.BytesIO(source_bytes))
    image.load()

    max_dimension = max(image.size)
    if max_dimension > max_size:
        ratio = max_size / float(max_dimension)
        resized = (
            max(1, int(round(image.size[0] * ratio))),
            max(1, int(round(image.size[1] * ratio))),
        )
        image = image.resize(resized, Image.Resampling.LANCZOS)

    output = io.BytesIO()
    normalized_mime = (mime_type or "").lower()
    has_alpha = "A" in image.getbands()

    if normalized_mime == "image/png" and has_alpha:
        image.save(output, format="PNG", optimize=True)
        return output.getvalue(), "image/png"

    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    image.save(
        output,
        format="JPEG",
        quality=jpeg_quality,
        optimize=True,
        progressive=True,
        subsampling="4:2:0",
    )
    return output.getvalue(), "image/jpeg"


def optimize_glb(input_path: Path, output_path: Path, max_size: int, jpeg_quality: int) -> tuple[int, int]:
    gltf = GLTF2().load(input_path.as_posix())
    blob = gltf.binary_blob()
    if blob is None:
        raise ValueError(f"{input_path} does not contain an embedded binary blob")

    replacements: dict[int, bytes] = {}

    for image in gltf.images or []:
        if image.bufferView is None:
            continue

        buffer_view = gltf.bufferViews[image.bufferView]
        original_bytes = get_buffer_view_bytes(blob, buffer_view.byteOffset, buffer_view.byteLength)
        optimized_bytes, updated_mime_type = encode_image(
            original_bytes,
            image.mimeType,
            max_size=max_size,
            jpeg_quality=jpeg_quality,
        )
        replacements[image.bufferView] = optimized_bytes
        image.mimeType = updated_mime_type

    rebuilt = bytearray()

    for index, buffer_view in enumerate(gltf.bufferViews or []):
        source = replacements.get(
            index,
            get_buffer_view_bytes(blob, buffer_view.byteOffset, buffer_view.byteLength),
        )
        aligned_offset = len(rebuilt)
        buffer_view.byteOffset = aligned_offset
        buffer_view.byteLength = len(source)
        rebuilt.extend(pad4(source))

    if not gltf.buffers:
        raise ValueError(f"{input_path} does not define any buffers")

    gltf.buffers[0].byteLength = len(rebuilt)
    gltf.set_binary_blob(bytes(rebuilt))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    gltf.save_binary(output_path.as_posix())
    return os.path.getsize(input_path), os.path.getsize(output_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Optimize embedded GLB textures by resizing and recompressing them.")
    parser.add_argument("inputs", nargs="+", help="Input GLB files")
    parser.add_argument("--max-size", type=int, default=1024, help="Maximum width/height for embedded textures")
    parser.add_argument("--jpeg-quality", type=int, default=72, help="JPEG quality for recompressed textures")
    parser.add_argument("--suffix", default=".opt", help="Suffix to append before the .glb extension")
    args = parser.parse_args()

    for input_name in args.inputs:
        input_path = Path(input_name)
        output_path = input_path.with_name(f"{input_path.stem}{args.suffix}{input_path.suffix}")
        before, after = optimize_glb(
            input_path=input_path,
            output_path=output_path,
            max_size=args.max_size,
            jpeg_quality=args.jpeg_quality,
        )
        reduction = 100 - ((after / before) * 100)
        print(
            f"{input_path.name} -> {output_path.name} | "
            f"{before / (1024 * 1024):.2f} MB -> {after / (1024 * 1024):.2f} MB | "
            f"-{reduction:.1f}%"
        )


if __name__ == "__main__":
    main()
