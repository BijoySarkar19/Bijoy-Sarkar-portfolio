import os
import zipfile
from pathlib import Path

def package_repo():
    root_dir = Path(__file__).resolve().parent.parent
    output_dir = root_dir / "public" / "downloads"
    output_dir.mkdir(parents=True, exist_ok=True)
    zip_path = output_dir / "portfolio-source.zip"

    exclude_dirs = {
        "node_modules",
        ".next",
        ".git",
        "__pycache__",
        ".turbo",
        ".cache",
    }

    exclude_files = {
        "portfolio-source.zip",
        ".env",
        ".env.local",
        "dev.db",
        "dev.db-journal",
        "secret.yaml",  # k8s/secret.yaml contains live cluster credentials
    }

    print(f"Packaging repository from: {root_dir}")
    print(f"Output ZIP path: {zip_path}")

    file_count = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zip_file:
        for dirpath, dirnames, filenames in os.walk(root_dir):
            current_path = Path(dirpath)
            rel_dir = current_path.relative_to(root_dir)

            # Filter out excluded directories
            dirnames[:] = [d for d in dirnames if d not in exclude_dirs and not d.startswith(".git")]

            # Skip if any parent part is in exclude_dirs
            if any(part in exclude_dirs for part in rel_dir.parts):
                continue

            for file in filenames:
                if file in exclude_files:
                    continue
                if file.endswith(".pyc") or file.endswith(".tmp"):
                    continue

                full_file_path = current_path / file
                rel_file_path = full_file_path.relative_to(root_dir)

                # Skip output zip if inside downloads
                if str(rel_file_path).replace("\\", "/") == "public/downloads/portfolio-source.zip":
                    continue

                zip_file.write(full_file_path, arcname=str(rel_file_path))
                file_count += 1

    zip_size_mb = zip_path.stat().st_size / (1024 * 1024)
    print(f"Successfully packaged {file_count} files into {zip_path} ({zip_size_mb:.2f} MB)")

if __name__ == "__main__":
    package_repo()
