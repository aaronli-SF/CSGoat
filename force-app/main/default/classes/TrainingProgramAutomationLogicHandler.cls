public with sharing class TrainingProgramAutomationLogicHandler {
    public static void updateTimeNeeded(List<Training_Program__c> trainingProgramTrigger) {
        Decimal expectedDuration = 0;
        Training_Program__c triggeredProgram = trainingProgramTrigger[0];
        Id currTrainingProgram = triggeredProgram.ID;
    
        List<Program_Task_Assignment__c> programTaskList = [SELECT Training_Program__c, Training_Task__c
                                                            FROM Program_Task_Assignment__c
                                                            WHERE Training_Program__c= :currTrainingProgram];
                                                            
        List<Training_Task__c> trainingTaskList = [SELECT id, Expected_Duration_In_Minutes__c
                                                    FROM Training_Task__c];
    
        for (Program_Task_Assignment__c pta : programTaskList){
            for (Training_Task__c training:trainingTaskList){
                if (pta.Training_Task__c == training.id){
                    expectedDuration += training.Expected_Duration_In_Minutes__c;
                }
            }
        }
    
        triggeredProgram.Expected_Duration_In_Minutes__c = expectedDuration;
    }
}
