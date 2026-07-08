import os
import stat
import sys
import zipfile


payload, archive_path = sys.argv[1], sys.argv[2]


def normalize(name):
    return name.replace("\\", "/")


def mode_for(arcname, is_dir):
    arcname = normalize(arcname)
    if is_dir:
        return 0o755
    if arcname.endswith("/Contents/MacOS/地球online成就殿堂"):
        return 0o755
    if arcname.endswith("/Resources/launch-earth-online-achievement-palace.command"):
        return 0o755
    if "/Resources/runtime/" in arcname and arcname.endswith("/bin/node"):
        return 0o755
    return 0o644


def zip_info(arcname, is_dir):
    arcname = normalize(arcname)
    if is_dir and not arcname.endswith("/"):
        arcname += "/"
    info = zipfile.ZipInfo(arcname)
    info.create_system = 3
    file_type = stat.S_IFDIR if is_dir else stat.S_IFREG
    info.external_attr = (file_type | mode_for(arcname, is_dir)) << 16
    return info


with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for current, dirs, files in os.walk(payload):
        dirs.sort()
        files.sort()
        rel_dir = os.path.relpath(current, payload)
        if rel_dir != ".":
            archive.writestr(zip_info(rel_dir, True), b"")
        for filename in files:
            full = os.path.join(current, filename)
            arcname = os.path.relpath(full, payload)
            with open(full, "rb") as handle:
                archive.writestr(zip_info(arcname, False), handle.read())
