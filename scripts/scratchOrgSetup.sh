#!/usr/bin/env bash

echo "Creating Scratch Org ..."
sfdx force:org:create -f ../config/project-scratch-def.json -a $1 --setdefaultusername --durationdays 30

echo "Deploying Metadata ..."
sfdx force:source:deploy -p ../force-app/main/default/

echo "Assigning Permissions"
sfdx force:user:permset:assign --permsetname CSGoat_Full_Perms --targetusername $1
