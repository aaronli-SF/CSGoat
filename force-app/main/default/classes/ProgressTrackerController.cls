public with sharing class ProgressTrackerController {
    @AuraEnabled(cacheable=true)
    public static List<Program_Contact_Assignment__c> populateTable(Id contactId, String searchText){
        List<Program_Contact_Assignment__c> result = new List<Program_Contact_Assignment__c>();

        if(String.isblank(searchText)){
            result = [SELECT Training_Program__c, Training_Program__r.Name, Start_Date__c, End_Date__c, Week__c, Time_Taken__c, Training_Program__r.Expected_Duration_In_Minutes__c		 
                        FROM Program_Contact_Assignment__c 
                        WHERE Contact__c = :contactId];
        } else {
            String filterText = '%' + searchText + '%';
            result = [SELECT Training_Program__c, Training_Program__r.Name, Start_Date__c, End_Date__c, Week__c, Time_Taken__c, Training_Program__r.Expected_Duration_In_Minutes__c	 
                        FROM Program_Contact_Assignment__c 
                        WHERE Contact__c = :contactId and Training_Program__r.Name like :filterText];
        }
        
        return result;
    }
}
