public with sharing class ProgramContactAssignmentLogicHandler {

    public static void updateTasks(List<Program_Contact_Assignment__c> ctaTrigger){
        List<Contact_Task_Assignment__c> listToInsert = new List<Contact_Task_Assignment__c>();

        for(Program_Contact_Assignment__c triggeredAssignment : ctaTrigger){
            ID currTrainingProgram= triggeredAssignment.Training_Program__c;
            Date startDate = triggeredAssignment.Start_Date__c;
            List<Program_Task_Assignment__c> programTaskList = [SELECT Training_Program__c, Training_Task__c, Due_Day__c
                                                                FROM Program_Task_Assignment__c 
                                                                WHERE Training_Program__c = :currTrainingProgram];
            if (!programTaskList.isEmpty()){
                for (Program_Task_Assignment__c pta : programTaskList){
                    Contact_Task_Assignment__c currTaskAssignment = new Contact_Task_Assignment__c();
                    currTaskAssignment.Contact__c = triggeredAssignment.Contact__c;
                    currTaskAssignment.Associated_Program__c = currTrainingProgram;
                    currTaskAssignment.Training_Task__c = pta.Training_Task__c;
                    currTaskAssignment.Due_Day__c = startDate.addDays((Integer)pta.Due_Day__c);
                    currTaskAssignment.Status__c = 'Not Started';
                    listToInsert.add(currTaskAssignment);
                }
            }
        }
    
        if(!listToInsert.isEmpty()){
            insert listToInsert;
        }
    }
}
