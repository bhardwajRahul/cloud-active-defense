# check if the decoy redirect to the clone once triggered

# Configure decoys
config='
{
  "filters": [
    {
      "decoy": {
        "key": "x-cloud-active-defense",
        "separator": "=",
        "value": "ACTIVE"
      },
      "detect": {
        "seek": {
          "inRequest": ".*",
          "in": "header" 
        },
        "alert": {
          "severity": "HIGH",
          "whenComplete": true
        },
        "respond": {
          "source": "ip",
          "behavior": "divert",
          "delay": "5s",
          "duration": "forever"
        }
      }
    }
  ]
}
'
# reseting banlist
echo '{"list":[]}' | docker exec -i configmanager sh -c 'cat > /data/blacklist/blacklist.json'
# connect to configmanager, update /data/cad-default.json and /data/config-default.json
echo "$config" | docker exec -i configmanager sh -c 'cat > /data/cad-default.json'
# wait a few seconds for the proxy to read the new config
sleep 5


# Start timing
start_time=$(date +%s.%N)

# Temporary file for curl output
tempfile=$(bash ./uuidgen.sh)

# Call it once first to trigger the alert and get blacklisted
curl -v -H "x-cloud-active-defense: ACTIVE" -s http://localhost:8000/ &>/dev/null

# Wait a little for the delay option
sleep 5
# Do relevant action(s)
curl -v http://localhost:8000/ >$tempfile 2>&1

# Check it was correctly redirect to clone (in $tempfile)
status=$(grep "CLONE" $tempfile)

# Output result & time
if [ -z "$status" ]; then
  echo -e "\033[0;31mFAIL\033[0m"
else
  echo -e "\033[0;32mPASS\033[0m"
fi

check_1_time=$(date +%s.%N)
execution_time=$(echo "$check_1_time $start_time" | awk '{print $1 - $2}')
echo "Execution time: $execution_time seconds"

# Cleanup
rm $tempfile

