public with sharing class ProgressTrackerTaskModal {

    @AuraEnabled(cacheable=true)
    public static List<Contact_Task_Assignment__c> populateModal(Id contactId, Id programId, String searchText){
        List<Contact_Task_Assignment__c> result = new List<Contact_Task_Assignment__c>();

        if(String.isblank(searchText)){
            result = [SELECT Associated_Program__c, Associated_Program__r.Name, Id, Training_Task__r.Name, Status__c, Contact__r.ReportsTo.Owner.Id, Completion_Date__c, Time_Taken_In_Minutes__c 
                        FROM Contact_Task_Assignment__c 
                        WHERE Contact__c = :contactId and Associated_Program__c = :programId];
        } else {
            String filterText = '%' + searchText + '%';
            result = [SELECT Associated_Program__c, Associated_Program__r.Name, Id, Training_Task__r.Name, Status__c, Contact__r.ReportsTo.Owner.Id, Completion_Date__c, Time_Taken_In_Minutes__c
                    FROM Contact_Task_Assignment__c 
                    WHERE Contact__c = :contactId and Associated_Program__c = :programId and Training_Task__r.Name like :filterText];
        }
        return result;
    }

    @AuraEnabled
    public static Task saveTask(String subject, String description, String priority, String type, Id owner, Id taskRelatedId, Id contactId){
        Task createdTask = new Task();
        createdTask.subject = subject;
        createdTask.priority = priority;
        createdTask.Type = type;

        // Who it is assigned to
        createdTask.OwnerId = owner;
        createdTask.ActivityDate = Date.today() + 2;
        createdTask.WhatId = taskRelatedId;
        createdTask.WhoId = contactId;
        insert createdTask;
        return createdTask; 
    }

    @AuraEnabled 
    public static Contact_Task_Assignment__c completeTrainingTask(Id associatedTask){
        Contact_Task_Assignment__c updatedTask = [SELECT Status__c, Completion_Date__c
                                                    FROM Contact_Task_Assignment__c 
                                                    WHERE ID = :associatedTask];
        updatedTask.Status__c = 'Complete';
        updatedTask.Completion_Date__c = Date.today();
        update updatedTask;
        return updatedTask;
    }

    @AuraEnabled 
    public static List<Contact_Task_Assignment__c> bulkCompleteTrainingTask(List<Id> taskList){
        List<Contact_Task_Assignment__c> resultList = new List<Contact_Task_Assignment__c>();

        Set<ID> taskIDs = new Set<ID>();
        for(Integer i = 0; i < taskList.size(); i++){
            taskIDs.add(taskList[i]);
        }
        Map<ID, Contact_Task_Assignment__c> assignmentMap = new Map<ID, Contact_Task_Assignment__c>(
            [SELECT Status__c, Completion_Date__c
                FROM Contact_Task_Assignment__c 
                WHERE ID IN :taskIDs]
        );

        for(Integer i = 0; i < taskList.size(); i++){
            Contact_Task_Assignment__c updatedTask = assignmentMap.get(taskList[i]);
            updatedTask.Status__c = 'Complete';
            updatedTask.Completion_Date__c = Date.today();
            resultList.add(updatedTask);
        }
        if(!resultList.isEmpty()){
            update resultList;
        }
        return resultList;
    }

    public class CTADraftValues {
        // these variables need to be named the same as the JS variables passed into JSON deserializer, otherwise they would store null values
        public Integer Modal_Time_Taken_In_Minutes;
        public Id Id;
    }

    @AuraEnabled
    public static string updateTimeTakenInMinutes(Object data) {
        // cta update DML list
        List<Contact_Task_Assignment__c> ctaUpdate = new List<Contact_Task_Assignment__c>();
        // create a list of CTADraftValues that contains the TimeTakenInMinutes and Id
        List<CTADraftValues> ctaData = (List<CTADraftValues>) JSON.deserialize(
            JSON.serialize(data),
            List<CTADraftValues>.class
        );

        // create a map to quickly access TimeTakenInMinutes and ID
        Map<Id,Decimal> ctaNewMap = new Map<Id,Integer>();
        // create a set to ensure key uniqueness and pass into SOQL
        Set<Id> ctaSet = new Set<Id>();
        for (CTADraftValues ctaDraftValue: ctaData){
            System.debug('ctaDraftValue = ' + ctaDraftValue);
            ctaNewMap.put(ctaDraftValue.Id, ctaDraftValue.Modal_Time_Taken_In_Minutes);
            ctaSet.add(ctaDraftValue.Id);
        }

        // query necessary fields and objects
        Map<ID,Contact_Task_Assignment__c> ctaOldMap = new Map<ID,Contact_Task_Assignment__c>(
            [SELECT Id, Time_Taken_In_Minutes__c
                FROM Contact_Task_Assignment__c
                WHERE Id IN :ctaSet]
        );

        // replace old values with new values
        for (Id ctaID: ctaSet){
            Contact_Task_Assignment__c cta = ctaOldMap.get(ctaID);
            cta.Time_Taken_In_Minutes__c = ctaNewMap.get(ctaID);
            ctaUpdate.add(cta);
        }

        try {
            if (ctaUpdate.size() > 0) update ctaUpdate;
            //System.debug('ctaForUpdate = ' + ctaForUpdate);
            return 'Success: contact task assignments updated successfully';
        }
        catch (Exception e) {
            System.debug('The following exception has occured: ' + e);
            return 'The following exception has occurred: ' + e.getMessage();
        }
    }
}
