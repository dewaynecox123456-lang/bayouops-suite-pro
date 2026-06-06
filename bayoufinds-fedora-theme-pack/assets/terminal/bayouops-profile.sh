# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

if [ -n "${BASH_VERSION:-}" ]; then
  export PS1='\[\e[38;5;72m\]BayouOps\[\e[0m\] \[\e[38;5;67m\]\u@\h\[\e[0m\]:\[\e[38;5;250m\]\w\[\e[0m\]\$ '
fi

if [ -n "${ZSH_VERSION:-}" ]; then
  export PROMPT='%F{green}BayouOps%f %F{blue}%n@%m%f:%F{white}%~%f%# '
fi
