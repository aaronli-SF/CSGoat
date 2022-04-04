public with sharing class ProgramContactAssignmentHandler {

    public static void isAfterInsert(){
        ProgramContactAssignmentLogicHandler.updateTasks(Trigger.new);
    }

}