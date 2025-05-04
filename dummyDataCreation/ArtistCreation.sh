#!/bin/bash

SHELL_NAME=$(basename "$0")
EXIT_CODE=0
EXIT_ERR=1

SAMPLE_COMMAND="bash ${SHELL_NAME} artistList.json"

if [ $# -ne 1 ]; then
    echo "Wrong Command Format! Correct Format: bash ${SHELL_NAME} uname limit"
    echo "Sample Command: ${SAMPLE_CMD}"
    exit ${EXIT_ERR}
fi

for row in $(jp -c '.[]' $1); do
  curl -X POST -H "Content-Type: application/json"\
  -d "{\"name\": \"${row.name}\"}", \
done