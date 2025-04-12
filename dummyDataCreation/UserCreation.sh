#!/bin/bash

SHELL_NAME=$(basename "$0")
EXIT_CODE=0
EXIT_ERR=1

SAMPLE_COMMAND="bash ${SHELL_NAME} test 10"

if [ $# -ne 2 ]; then
    echo "Wrong Command Format! Correct Format: bash ${SHELL_NAME} uname limit"
    echo "Sample Command: ${SAMPLE_CMD}"
    exit ${EXIT_ERR}
fi

UNAME=$1
LIMIT=$2

for ((i=1; i<=LIMIT; i++)); do 
    USER="${UNAME}${i}"
    curl -X POST -H "Content-Type: application/json" \
        -d "{\"name\": \"${USER}\", \"email\": \"${USER}@gmail.com\", \"password\": \"${USER}${i}\"}" \
        http://localhost:3000/api/users/registerUser    
done