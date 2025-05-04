#!/bin/bash

SHELL_NAME=$(basename "$0")
EXIT_CODE=0
EXIT_ERR=1

SAMPLE_COMMAND="bash ${SHELL_NAME} artistList.json token"

if [ $# -ne 2 ]; then
    echo "Wrong Command Format! Correct Format: bash ${SHELL_NAME} uname limit"
    echo "Sample Command: ${SAMPLE_COMMAND}"
    exit ${EXIT_ERR}
fi

jq -c '.artists[]' "$1" | while read -r row; do
  name=$(echo "$row" | jq -r '.name')
  type=$(echo "$row" | jq -r '.type')
  curl -X POST -H "Authorization: Bearer ${2}" -H "Content-Type: application/json"\
  -d "{\"name\": \"${name}\", \"type\": \"${type}\" }" \
        http://localhost:3000/api/artists/createArtist
done