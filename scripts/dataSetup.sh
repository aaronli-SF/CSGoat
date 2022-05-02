#!/usr/bin/env bash

echo "Importing data "
sfdx force:data:tree:export -u Capstone --query \
      "SELECT Id, CreatedById, Description__c, Expected_Duration_In_Minutes__c, LastModifiedById, OwnerId, RecordTypeId, Task_Link__c, \
      Task_Type__c, Trailhead_Points__c, Name \
       FROM Training_Task__c" \
     --prefix export-demo --outputdir sfdx-out --plan