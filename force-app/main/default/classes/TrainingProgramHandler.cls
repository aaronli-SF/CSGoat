public with sharing class TrainingProgramHandler {
    public static void isBeforeInsertOrUpdate(){
        TrainingProgramAutomationLogicHandler.updateTimeNeeded(Trigger.new);
    }
}
