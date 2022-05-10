public with sharing class ContactTaskAutomationHandler {
    public static void isBeforeUpdate(){
        ContactTaskAutomationLogicHandler.updateTimeTaken(Trigger.new, Trigger.old);
    }
    public static void isAfterUpdate(){
        ContactTaskAutomationLogicHandler.checkForSubtraction(Trigger.new, Trigger.old);
    }
}
