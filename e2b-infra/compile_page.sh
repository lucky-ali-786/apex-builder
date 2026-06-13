#!/bin/bash

# This script runs during building the sandbox template
# and makes sure the Next.js app is (1) running and (2) the `/` page is compiled

function ping_server() {
  counter=0
  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
  
  while [[ ${response} -ne 200 ]]; do
    let counter++
    if (( counter % 20 == 0 )); then
      echo "Waiting for server to start..."
      sleep 0.1
    fi
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
  done
  
  echo "✅ Next.js server is up and compiled!"
}

# Run the ping loop in the background
ping_server &

# Boot up the Next.js development server using Turbopack for speed
cd /home/user && npx next dev --turbopack