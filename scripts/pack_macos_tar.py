import os
import sys
import tarfile


payload, archive_path = sys.argv[1], sys.argv[2]


def normalize(name):
    return name.replace("\\", "/")


def mode_for(arcname, is_dir):
    arcname = normalize(arcname)
    if is_dir:
        return 0o755
    if arcname.endswith("/Contents/MacOS/EarthOnlineAchievementPalace"):
        return 0o755
    if arcname.endswith("/Resources/launch-earth-online-achievement-palace.command"):
        return 0o755
    if "/Resources/runtime/" in arcname and arcname.endswith("/bin/node"):
        return 0o755
    return 0o644


with tarfile.open(archive_path, "w:gz", format=tarfile.PAX_FORMAT) as archive:
    for current, dirs, files in os.walk(payload):
        dirs.sort()
        files.sort()
        rel_dir = os.path.relpath(current, payload)
        if rel_dir != ".":
            arcdir = normalize(rel_dir)
            info = archive.gettarinfo(current, arcdir)
            info.mode = mode_for(arcdir, True)
            info.uid = info.gid = 0
            info.uname = info.gname = ""
            archive.addfile(info)
        for filename in files:
            full = os.path.join(current, filename)
            arcname = normalize(os.path.relpath(full, payload))
            info = archive.gettarinfo(full, arcname)
            info.mode = mode_for(arcname, False)
            info.uid = info.gid = 0
            info.uname = info.gname = ""
            with open(full, "rb") as handle:
                archive.addfile(info, handle)
