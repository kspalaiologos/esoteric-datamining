#!/bin/bash

if [ -d esologs ]; then
    cd esologs && git pull && cd ..
else
    git clone --depth 1 https://github.com/kspalaiologos/esologs
    echo ".slug" >> esologs/.gitignore
fi

cd esologs

for f in *.txt; do
    echo " [+] $f"
    
    # Could have probably used sed, but sed is dumb as bricks and I'm familiar only with perl.
    # For some reason, the same regex doesn't work with sed.
    
    # This one will filter out everything except messages; subsequent sed invocations will remove
    # all known bot messages from the input.
    perl -pe '
        s/[0-9]+\-[0-9]+\-[0-9]+ [0-9]+:[0-9]+:[0-9]+ [^\<].*\n//;
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
  | sed '/esowiki/ d'  > $f.slug  
done

cat *.slug > ../data.slug
rm -f *.slug

cd ..
