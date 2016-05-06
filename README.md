# shadowcat-data
[![travis](https://travis-ci.org/nypl-registry/shadowcat-data.svg)](https://travis-ci.org/nypl-registry/shadowcat-data/)

Tools to talk to Innovative's Sierra ILS v1 API and harvest data. There are also a lot of custom jobs to remediate the JSON MARC data into a native JSON fields within shadowcat in the jobs directory.

### config/local.json 
Holds the API keys and time ranges for the update jobs to run. (copy default.json to local.json)

### jobs/update_bib\* & jobs/update_items\*
The jobs to keep the data updated from the API, it is assumed these jobs are run every 15min from a cron jobs, they detect if they are activly running and if they are in the run window to proceed.

Detailed log files are get in log by day.

Tests require active API connection.