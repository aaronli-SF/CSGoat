trigger ContactTaskAutomation on Contact_Task_Assignment__c (before update, after update) {
    if(Trigger.isUpdate && Trigger.isBefore){
        ContactTaskAutomationHandler.isBeforeUpdate();
    }
    if (Trigger.isUpdate && Trigger.isAfter){
        ContactTaskAutomationHandler.isAfterUpdate();
    }
}