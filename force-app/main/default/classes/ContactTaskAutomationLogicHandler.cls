public with sharing class ContactTaskAutomationLogicHandler {
    public static void updateTimeTaken(List<Contact_Task_Assignment__c> ctaTrigger) {

        Map<Id, Program_Contact_Assignment__c> resultMap = new Map<Id, Program_Contact_Assignment__c>();
        Boolean multiple = false;
        //Decimal needed for multiple apex requests in one trigger
        Decimal myTime = 0;
        if(ctaTrigger.size() > 1){
            multiple = true;
        }

        Set<ID> taskIdSet = new Set<ID>();
        for (Contact_Task_Assignment__c triggeredCta: ctaTrigger){
            taskIdSet.add(triggeredCta.Training_Task__c);
        }

        Map<ID, Training_Task__c> taskMap = new Map<ID, Training_Task__c>(
            [SELECT Expected_Duration_In_Minutes__c
                FROM Training_Task__c
                WHERE Id IN :taskIdSet]
        );
        
        for (Contact_Task_Assignment__c triggeredCta: ctaTrigger){
            ID currTask = triggeredCta.Training_Task__c;
            Program_Contact_Assignment__c pca = programContactAssignmentFetch(triggeredCta);
            Training_Task__c task = taskMap.get(currTask);
            
            //Create a result list to update
            if (triggeredCta.Status__c == 'Complete'){
                //Handle bulk apex change
                if (multiple == true){
                    if (myTime != Null){
                        myTime += task.Expected_Duration_In_Minutes__c;
                    } else {
                        myTime = task.Expected_Duration_In_Minutes__c;
                    }
                    pca.Time_Taken__c = myTime;
                //Handle individual apex change 
                } else {
                    if (pca.Time_Taken__c != Null){
                        pca.Time_Taken__c += task.Expected_Duration_In_Minutes__c;
                    } else {
                        pca.Time_Taken__c = task.Expected_Duration_In_Minutes__c;
                    }
                }
                resultMap.put(pca.Training_Program__c, pca);
            }
        }
        update resultMap.values();
    }

    //Cannot use a map because we do not know the ID in order to get the triggered contact task assignment
    public static void checkForSubtraction(List<Contact_Task_Assignment__c> ctaTrigger, List<Contact_Task_Assignment__c> oldCtaTrigger){
        Contact_Task_Assignment__c triggeredCta = ctaTrigger[0];
        ID currTask = triggeredCta.Training_Task__c;

        Program_Contact_Assignment__c pca = programContactAssignmentFetch(triggeredCta);
        
        List<Training_Task__c> task = [SELECT Expected_Duration_In_Minutes__c
                                        FROM Training_Task__c
                                        WHERE Id = :currTask];

        for(Contact_Task_Assignment__c newCta : ctaTrigger){
            for (Contact_Task_Assignment__c oldCta: oldCtaTrigger){
                if (oldCta.Status__c == 'Complete' && newCta.Status__c != 'Complete'){
                    //Null and zero check
                    if (pca.Time_Taken__c != Null || pca.Time_Taken__c > 0){
                        pca.Time_Taken__c -= task[0].Expected_Duration_In_Minutes__c;
                    }
                }
            }
        }
        update pca;
    }

    private static Program_Contact_Assignment__c programContactAssignmentFetch(Contact_Task_Assignment__c triggeredCta){
        ID currTrainingProgram = triggeredCta.Associated_Program__c;
        ID contact = triggeredCta.Contact__c;

        Program_Contact_Assignment__c pca = [SELECT Training_Program__c, Time_Taken__c
                                                    FROM Program_Contact_Assignment__c
                                                    WHERE Training_Program__c = :currTrainingProgram AND Contact__c=:contact];
        return pca;
    }
}
