from datetime import datetime
import os
import subprocess


date = datetime.now().strftime("%Y-%m-%d")


frontmatter = "---\n"
frontmatter += f"date: {date}\n"
frontmatter += "---\n"


try:
    os.mkdir(f"content/til/{date}/")
except FileExistsError:
    pass


f_path = f"content/til/{date}/index.md"


if not os.path.exists(f_path):
    with open(f_path, "w") as new_post:
        new_post.write(frontmatter)
        new_post.close()


subprocess.call(f"nvim {f_path}", shell=True)
