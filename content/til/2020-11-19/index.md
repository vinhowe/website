---
date: 2020-11-19
---

- [Dragon](https://github.com/mwh/dragon) provides an easy way to use drag and
  drop with the terminal.
- Here's how to use it with stdin in fish: `dragon (cat ~/test.pdf | psub -s .pdf)`
  - Info about `psub` in fish: https://fishshell.com/docs/current/cmds/psub.html
  - Info about process substitution in bash:
    https://tldp.org/LDP/abs/html/process-sub.html
- And here's how to convert JPG to a PDF with imagemagick and then immediately
  bring it into dragon, again, using fish:
  `dragon (convert image.jpg PDF:- | psub -s .pdf)`
  - Using bash: `convert image.jpg PDF:- dragon <(cat)` (though I haven't been
    able to figure out how to add a suffix to command substitution in bash; if
    you know how to do this, please reach out to me and let me know 🙂)
