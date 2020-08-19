#!/bin/bash

# Could have probably used sed, but sed is dumb as bricks and I'm familiar only with perl.
# For some reason, the same regex doesn't work with sed.

# This one will filter out everything except messages; subsequent sed invocations will remove
# all known bot messages from the input.

# It also filters out messages written mostly by people attempting to impost/deface me back in 2019.

function process {
    echo " [+] $f"
    
    perl -pe '
        s/^[0-9]+\-[0-9]+\-[0-9]+ [0-9]+:[0-9]+:[0-9]+ //;
        s/^[^\<].*\n//;
    ' < $f \
  | sed '/HackEso/ d' \
  | sed '/bfbot/ d' \
  | sed '/fungot/ d' \
  | sed '/EgoBot/ d' \
  | sed '/lambdabot/ d' \
  | sed '/thutubot/ d' \
  | sed '/metasepia/ d' \
  | sed '/idris-bot/ d' \
  | sed '/jconn/ d' \
  | sed '/j-bot/ d' \
  | sed '/szefczyk/ d' \
  | sed '/patologios/ d' \
  | sed '/1,8JS/ d' \
  | sed '/esowiki/ d' \
  | perl -pe '
        s/^<[A-Za-z0-9\[\]\-\_\^]+> //;
    ' > $f.slug
}

# Clone the repo if it wasn't cloned before and add a *.slug entry.
# If the directory with it already exists, just pull the repo.

if [ -d esologs ]; then
    cd esologs && git pull && cd ..
else
    git clone --depth 1 https://github.com/kspalaiologos/esologs
    echo ".slug" >> esologs/.gitignore
    echo ".md5" >> esologs/.gitignore
    md5sum < `basename $0` > esologs/a.md5
fi

# Invalidate cache if it was built with another version of the script.
md5sum < `basename $0` > esologs/b.md5

if ! diff esologs/a.md5 esologs/b.md5 >/dev/null 2>&1; then
    echo " [-] Cache miss.";
    rm -f esologs/a.md5
    cp esologs/b.md5 esologs/a.md5
    rm -f esologs/b.md5 esologs/*.slug
else
    echo " [+] Cache hit.";
fi

rm -f esologs/actual_md5.slug

cd esologs

# Process all the files; build the slug files.

pids=()

for f in *.txt; do
    if [ ! -f "$f.slug" ]; then
        process $f &
        pids[${#pids[@]}]=$!
    else
        echo " [!] Already cached: $f"
    fi
done

# Synchronize the operation.

for pid in ${pids[*]}; do
    echo " [~] Waiting for $pid."
    wait $pid
done

# Concat all slugs into ../data.slug, read by the markov chain
# node.js script.

cat *.slug > ../data.slug

cd ..
