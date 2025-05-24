#!/bin/bash
# copies files from one location 
# puts them in a new folder in another location


og_loc=$1
new_loc=$2
new_folder_name=$3

if [ $# -ne 3 ]; then # if not given the 3 args needed
 echo "Number of arguments: $#"
 echo "usage ./file_mover.sh og_loc new_loc new_location_folder_name"
 exit 1
fi
new_final_loc="$new_loc/$new_folder_name/"
mkdir "$new_final_loc"
if [ $? -ne 0 ]; then
  echo "mkdir failed, exiting"
  exit 1
fi

for file in "$og_loc"/*; do
    cp -r "$file" "$new_final_loc"
    if [ $? -ne 0 ]; then
        echo "cp failed, exiting"
        exit 1
    fi
done

rm -rf "$og_loc"

# ./file_mover.sh output ../basic-ruffle-player/html/ just_fall_lol
