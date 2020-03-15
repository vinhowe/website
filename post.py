from datetime import datetime
import os
title = input("title: ")
description = input("description (or nothing): ")
slug = input("slug: ")
date = datetime.now().isoformat()

frontmatter = "---\n"

if title != "\n":
    frontmatter += f"title: {title}\n"

if description != "\n":
    frontmatter += f"description: {description}\n"

frontmatter += f"date: {date}\n"

frontmatter += "---\n"

os.mkdir(f"content/blog/{slug}")

with open(f"content/blog/{slug}/index.md", "w") as new_post:
    new_post.write(frontmatter)
    new_post.close()
