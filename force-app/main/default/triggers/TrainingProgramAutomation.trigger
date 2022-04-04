trigger TrainingProgramAutomation on Training_Program__c (before update, before insert) {
    if(Trigger.isBefore && (Trigger.isUpdate || Trigger.isInsert)){
        TrainingProgramHandler.isBeforeInsertOrUpdate();
    }
}