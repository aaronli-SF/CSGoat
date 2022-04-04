public with sharing class ProgressTrackerTaskModal {

    @AuraEnabled(cacheable=true)
    public static List<Contact_Task_Assignment__c> populateModal(Id contactId, Id programId, String searchText){
        List<Contact_Task_Assignment__c> result = new List<Contact_Task_Assignment__c>();

        if(String.isblank(searchText)){
            result = [SELECT Associated_Program__c, Associated_Program__r.Name, Id, Training_Task__r.Name, Status__c, Contact__r.ReportsTo.Owner.Id 
                        FROM Contact_Task_Assignment__c 
                        WHERE Contact__c = :contactId and Associated_Program__c = :programId];
        } else {
            String filterText = '%' + searchText + '%';
            result = [SELECT Associated_Program__c, Associated_Program__r.Name, Id, Training_Task__r.Name, Status__c, Contact__r.ReportsTo.Owner.Id
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
}
